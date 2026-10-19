package com.staysafe.controller;

import com.staysafe.dto.Dtos.*;
import com.staysafe.dto.Mapper;
import com.staysafe.exception.ApiException;
import com.staysafe.model.Booking;
import com.staysafe.model.Property;
import com.staysafe.model.Ticket;
import com.staysafe.model.User;
import com.staysafe.repo.*;
import com.staysafe.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/** All endpoints require ROLE_ADMIN (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserRepository users;
    private final PropertyRepository properties;
    private final BookingRepository bookings;
    private final TicketRepository tickets;
    private final NotificationService notifications;

    public AdminController(UserRepository users, PropertyRepository properties, BookingRepository bookings,
                           TicketRepository tickets, NotificationService notifications) {
        this.users = users;
        this.properties = properties;
        this.bookings = bookings;
        this.tickets = tickets;
        this.notifications = notifications;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        List<Booking> paid = bookings.findAll().stream().filter(b -> !"Cancelled".equals(b.getStatus())).toList();
        long gross = paid.stream().mapToLong(Booking::getAmount).sum();
        return Map.of(
                "totalUsers", users.count(),
                "totalStays", properties.count(),
                "totalBookings", paid.size(),
                "platformRevenue", Math.round(gross * OwnerController.COMMISSION));
    }

    @GetMapping("/properties/pending")
    public List<PropertyDto> pending() {
        return properties.findByStatusOrderByIdAsc("Under Review").stream().map(Mapper::property).toList();
    }

    @PutMapping("/properties/{id}/approve")
    public PropertyDto approve(@PathVariable Long id) {
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property not found"));
        p.setStatus("Active");
        p.setVerified(true);
        properties.save(p);
        notifications.notify(p.getOwner(), "Listing Approved",
                p.getName() + " is verified and now live on StaySafe!", "system");
        return Mapper.property(p);
    }

    @PutMapping("/properties/{id}/reject")
    public PropertyDto reject(@PathVariable Long id) {
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property not found"));
        p.setStatus("Rejected");
        p.setVerified(false);
        properties.save(p);
        notifications.notify(p.getOwner(), "Listing Rejected",
                p.getName() + " did not pass verification. Please update documents and resubmit.", "audit");
        return Mapper.property(p);
    }

    @GetMapping("/tickets")
    public List<TicketDto> allTickets() {
        return tickets.findAllByOrderByCreatedAtDesc().stream().map(Mapper::ticket).toList();
    }

    @PutMapping("/tickets/{id}")
    public TicketDto updateTicket(@PathVariable Long id, @RequestBody TicketUpdate req) {
        Ticket t = tickets.findById(id).orElseThrow(() -> ApiException.notFound("Ticket not found"));
        if (req.response() != null && !req.response().isBlank()) t.setResponse(req.response());
        if (req.status() != null) t.setStatus(req.status());
        tickets.save(t);
        notifications.notify(t.getUser(), "Support Ticket " + t.getCode() + " Updated",
                "Status: " + t.getStatus() + (t.getResponse() != null ? " — " + t.getResponse() : ""), "support");
        return Mapper.ticket(t);
    }

    @GetMapping("/users")
    public List<UserDto> allUsers() {
        return users.findAll().stream().map(Mapper::user).toList();
    }

    @PutMapping("/users/{id}/toggle")
    public UserDto toggleUser(@PathVariable Long id, @AuthenticationPrincipal User admin) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("User not found"));
        if (u.getId().equals(admin.getId())) throw ApiException.badRequest("You cannot disable your own account");
        u.setEnabled(!u.isEnabled());
        return Mapper.user(users.save(u));
    }
}
