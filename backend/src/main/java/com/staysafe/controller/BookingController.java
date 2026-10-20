package com.staysafe.controller;

import com.staysafe.dto.Dtos.*;
import com.staysafe.dto.Mapper;
import com.staysafe.exception.ApiException;
import com.staysafe.model.Booking;
import com.staysafe.model.Property;
import com.staysafe.model.Role;
import com.staysafe.model.User;
import com.staysafe.repo.BookingRepository;
import com.staysafe.repo.PropertyRepository;
import com.staysafe.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingRepository bookings;
    private final PropertyRepository properties;
    private final NotificationService notifications;

    public BookingController(BookingRepository bookings, PropertyRepository properties, NotificationService notifications) {
        this.bookings = bookings;
        this.properties = properties;
        this.notifications = notifications;
    }

    @GetMapping("/me")
    public List<BookingDto> mine(@AuthenticationPrincipal User user) {
        return bookings.findByUserOrderByCreatedAtDesc(user).stream().map(Mapper::booking).toList();
    }

    /**
     * Creates a confirmed booking after (simulated) payment.
     * To use real Razorpay: create an order in a separate endpoint, verify the payment signature here
     * and store the real payment id in paymentRef.
     */
    @PostMapping
    @Transactional
    public BookingDto create(@AuthenticationPrincipal User user, @Valid @RequestBody BookingRequest req) {
        if (user.getRole() != Role.CUSTOMER) throw ApiException.forbidden("Only customers can book stays");
        Property p = properties.findById(req.propertyId()).orElseThrow(() -> ApiException.notFound("Property not found"));
        if (!"Active".equals(p.getStatus())) throw ApiException.badRequest("This property is not open for booking");
        if (req.checkIn().isBefore(LocalDate.now())) throw ApiException.badRequest("Check-in cannot be in the past");
        if (!req.checkOut().isAfter(req.checkIn())) throw ApiException.badRequest("Check-out must be after check-in");

        Booking b = new Booking();
        b.setCode("BK-" + (1000 + (int) (Math.random() * 9000)));
        b.setUser(user);
        b.setProperty(p);
        b.setCheckIn(req.checkIn());
        b.setCheckOut(req.checkOut());
        b.setGuests(req.guests() == null ? "1 Guest" : req.guests());
        b.setAmount(p.getPrice());
        b.setStatus("Confirmed");
        b.setPaymentMethod(req.paymentMethod() == null ? "upi" : req.paymentMethod());
        b.setPaymentRef("RZP_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14));
        bookings.save(b);

        p.setBookingsCount(p.getBookingsCount() + 1);
        properties.save(p);

        notifications.notify(user, "Booking Confirmed!",
                "Your stay at " + p.getName() + " is confirmed from " + b.getCheckIn() + ".", "booking");
        notifications.notify(user, "Payment Receipt Issued",
                "Payment of ₹" + b.getAmount() + " received (ref " + b.getPaymentRef() + ").", "payment");
        notifications.notify(p.getOwner(), "New Guest Booking",
                user.getName() + " booked " + p.getName() + " (" + b.getGuests() + ") from " + b.getCheckIn() + ".", "booking");
        return Mapper.booking(b);
    }

    @PutMapping("/{id}/cancel")
    @Transactional
    public BookingDto cancel(@PathVariable Long id, @AuthenticationPrincipal User user) {
        Booking b = bookings.findById(id).orElseThrow(() -> ApiException.notFound("Booking not found"));
        if (!b.getUser().getId().equals(user.getId())) throw ApiException.forbidden("Not your booking");
        if (!"Confirmed".equals(b.getStatus())) throw ApiException.badRequest("Only confirmed bookings can be cancelled");
        if (b.getCheckIn().isBefore(LocalDate.now().plusDays(2)))
            throw ApiException.badRequest("Free cancellation is only available up to 48 hours before check-in");

        b.setStatus("Cancelled");
        bookings.save(b);

        Property p = b.getProperty();
        p.setBookingsCount(Math.max(0, p.getBookingsCount() - 1));
        properties.save(p);

        notifications.notify(user, "Booking Cancelled",
                "Booking " + b.getCode() + " cancelled. Refund will reach you in 3-5 business days.", "booking");
        notifications.notify(p.getOwner(), "Booking Cancelled",
                user.getName() + " cancelled booking " + b.getCode() + " for " + p.getName() + ".", "booking");
        return Mapper.booking(b);
    }
}
