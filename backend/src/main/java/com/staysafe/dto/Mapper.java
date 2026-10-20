package com.staysafe.dto;

import com.staysafe.dto.Dtos.*;
import com.staysafe.model.*;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class Mapper {
    private Mapper() {}

    public static UserDto user(User u) {
        return new UserDto(u.getId(), u.getName(), u.getEmail(), u.getPhone(), u.getRole().name(), u.isEnabled());
    }

    public static PropertyDto property(Property p) {
        return new PropertyDto(p.getId(), p.getName(), p.getType(), p.getLocation(), p.getPrice(), p.getRating(),
                p.getReviewsCount(), p.isVerified(), p.getImage(), p.getImages(), p.getAmenities(),
                p.getDescription(), p.getStatus(), p.getBookingsCount(), p.getOwner().getName(),
                p.getOwner().getPhone(), p.getDeposit());
    }

    public static BookingDto booking(Booking b) {
        String status = b.getStatus();
        if ("Confirmed".equals(status) && b.getCheckOut().isBefore(LocalDate.now())) status = "Completed";
        Property p = b.getProperty();
        return new BookingDto(b.getCode(), b.getId(), p.getId(), p.getName(), p.getLocation(), b.getCheckIn(),
                b.getCheckOut(), b.getGuests(), b.getAmount(), status, p.getImage(), b.getPaymentMethod(),
                b.getPaymentRef(), b.getUser().getName(), b.getUser().getPhone());
    }

    public static TicketDto ticket(Ticket t) {
        return new TicketDto(t.getCode(), t.getId(), t.getSubject(), t.getMessage(), t.getStatus(),
                t.getResponse(), t.getUser().getName(), ago(t.getCreatedAt()));
    }

    public static NotificationDto notification(Notification n) {
        return new NotificationDto(n.getId(), n.getTitle(), n.getMessage(), n.getType(), n.isUnread(), ago(n.getCreatedAt()));
    }

    public static ReviewDto review(Review r) {
        return new ReviewDto(r.getId(), r.getUser().getName(), r.getRating(), r.getComment(),
                r.getCreatedAt().toLocalDate().toString());
    }

    public static String ago(LocalDateTime t) {
        long m = Duration.between(t, LocalDateTime.now()).toMinutes();
        if (m < 1) return "Just now";
        if (m < 60) return m + " mins ago";
        long h = m / 60;
        if (h < 24) return h + " hours ago";
        long d = h / 24;
        return d == 1 ? "Yesterday" : d + " days ago";
    }
}
