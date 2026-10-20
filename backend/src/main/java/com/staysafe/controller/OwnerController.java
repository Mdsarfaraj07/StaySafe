package com.staysafe.controller;

import com.staysafe.dto.Dtos.*;
import com.staysafe.dto.Mapper;
import com.staysafe.model.Booking;
import com.staysafe.model.Property;
import com.staysafe.model.Role;
import com.staysafe.model.User;
import com.staysafe.repo.BookingRepository;
import com.staysafe.repo.FavoriteRepository;
import com.staysafe.repo.PropertyRepository;
import com.staysafe.repo.ReviewRepository;
import com.staysafe.exception.ApiException;
import com.staysafe.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** All endpoints require ROLE_OWNER (see SecurityConfig). */
@RestController
@RequestMapping("/api/owner")
public class OwnerController {
    private static final String DEFAULT_IMAGE =
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
    public static final double COMMISSION = 0.10;

    private final PropertyRepository properties;
    private final BookingRepository bookings;
    private final FavoriteRepository favorites;
    private final ReviewRepository reviews;
    private final NotificationService notifications;

    public OwnerController(PropertyRepository properties, BookingRepository bookings,
                           FavoriteRepository favorites, ReviewRepository reviews,
                           NotificationService notifications) {
        this.properties = properties;
        this.bookings = bookings;
        this.favorites = favorites;
        this.reviews = reviews;
        this.notifications = notifications;
    }

    @GetMapping("/properties")
    public List<PropertyDto> myProperties(@AuthenticationPrincipal User owner) {
        return properties.findByOwnerOrderByIdDesc(owner).stream().map(Mapper::property).toList();
    }

    @PostMapping("/properties")
    public PropertyDto create(@AuthenticationPrincipal User owner, @Valid @RequestBody PropertyRequest req) {
        Property p = new Property();
        p.setName(req.name());
        p.setType(req.type());
        p.setLocation(req.location());
        p.setPrice(req.price());
        p.setDeposit(req.deposit() != null && req.deposit() > 0 ? req.deposit() : req.price() * 2);
        p.setDescription(req.description() == null || req.description().isBlank()
                ? "Newly listed property awaiting admin verification." : req.description());
        p.setAmenities(req.amenities() == null || req.amenities().isEmpty() ? List.of("WiFi") : req.amenities());
        List<String> imgs = req.images() == null ? new ArrayList<>() : req.images().stream().filter(s -> s != null && !s.isBlank()).toList();
        if (imgs.isEmpty()) imgs = List.of(DEFAULT_IMAGE);
        p.setImages(new ArrayList<>(imgs));
        p.setImage(imgs.get(0));
        p.setOwner(owner);
        p.setStatus("Under Review");
        p.setVerified(false);
        properties.save(p);

        notifications.notifyRole(Role.ADMIN, "New Verification Audit Request",
                p.getName() + " (" + owner.getName() + ") submitted documents for audit.", "audit");
        notifications.notify(owner, "Listing Submitted",
                p.getName() + " is awaiting admin verification.", "system");
        return Mapper.property(p);
    }

    @PutMapping("/properties/{id}")
    public PropertyDto update(@AuthenticationPrincipal User owner, @PathVariable Long id,
                              @Valid @RequestBody PropertyRequest req) {
        Property p = findOwnedProperty(id, owner);
        p.setName(req.name());
        p.setType(req.type());
        p.setLocation(req.location());
        p.setPrice(req.price());
        p.setDeposit(req.deposit() != null && req.deposit() > 0 ? req.deposit() : req.price() * 2);
        p.setDescription(req.description() == null ? "" : req.description());
        p.setAmenities(req.amenities() == null ? new ArrayList<>() : new ArrayList<>(req.amenities()));
        List<String> imgs = req.images() == null ? new ArrayList<>()
                : req.images().stream().filter(s -> s != null && !s.isBlank()).toList();
        if (imgs.isEmpty()) imgs = List.of(DEFAULT_IMAGE);
        p.setImages(new ArrayList<>(imgs));
        p.setImage(imgs.get(0));
        // Any owner-edited listing must be reviewed again before being publicly visible.
        p.setStatus("Under Review");
        p.setVerified(false);
        Property saved = properties.save(p);
        notifications.notifyRole(Role.ADMIN, "Property Update Needs Review",
                saved.getName() + " was updated by " + owner.getName() + " and needs verification.", "audit");
        notifications.notify(owner, "Property Updated",
                saved.getName() + " was updated and sent for admin verification.", "system");
        return Mapper.property(saved);
    }

    @DeleteMapping("/properties/{id}")
    public Map<String, String> delete(@AuthenticationPrincipal User owner, @PathVariable Long id) {
        Property p = findOwnedProperty(id, owner);
        // Keep booking, review and favorite history intact; do not delete referenced properties.
        if (bookings.existsByProperty(p) || reviews.existsByProperty(p) || favorites.existsByProperty(p)) {
            throw ApiException.conflict("This property has bookings, reviews, or favorites and cannot be deleted. Contact support if it should be removed.");
        }
        properties.delete(p);
        return Map.of("message", "Property deleted successfully");
    }

    private Property findOwnedProperty(Long id, User owner) {
        Property p = properties.findById(id)
                .orElseThrow(() -> ApiException.notFound("Property not found"));
        if (p.getOwner() == null || !p.getOwner().getId().equals(owner.getId())) {
            throw ApiException.forbidden("You can only manage your own properties");
        }
        return p;
    }

    @GetMapping("/bookings")
    public List<BookingDto> incoming(@AuthenticationPrincipal User owner) {
        return bookings.findByPropertyOwnerOrderByCreatedAtDesc(owner).stream().map(Mapper::booking).toList();
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@AuthenticationPrincipal User owner) {
        List<Property> mine = properties.findByOwnerOrderByIdDesc(owner);
        List<Booking> bk = bookings.findByPropertyOwnerOrderByCreatedAtDesc(owner).stream()
                .filter(b -> !"Cancelled".equals(b.getStatus())).toList();
        int gross = bk.stream().mapToInt(Booking::getAmount).sum();
        return Map.of(
                "listedProperties", mine.size(),
                "activeBookings", bk.size(),
                "totalEarnings", Math.round(gross * (1 - COMMISSION)),
                "pendingVerifications", mine.stream().filter(p -> "Under Review".equals(p.getStatus())).count());
    }
}
