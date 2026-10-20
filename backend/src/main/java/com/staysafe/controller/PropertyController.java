package com.staysafe.controller;

import com.staysafe.dto.Dtos.*;
import com.staysafe.dto.Mapper;
import com.staysafe.exception.ApiException;
import com.staysafe.model.Property;
import com.staysafe.model.Review;
import com.staysafe.model.Role;
import com.staysafe.model.User;
import com.staysafe.repo.BookingRepository;
import com.staysafe.repo.PropertyRepository;
import com.staysafe.repo.ReviewRepository;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/properties")
public class PropertyController {
    private final PropertyRepository properties;
    private final ReviewRepository reviews;
    private final BookingRepository bookings;

    public PropertyController(PropertyRepository properties, ReviewRepository reviews, BookingRepository bookings) {
        this.properties = properties;
        this.reviews = reviews;
        this.bookings = bookings;
    }

    /** Public: only verified & active listings. Optional filters: q, type, maxPrice */
    @GetMapping
    public List<PropertyDto> list(@RequestParam(required = false) String q,
                                  @RequestParam(required = false) String type,
                                  @RequestParam(required = false) Integer maxPrice) {
        return properties.findByStatusOrderByIdAsc("Active").stream()
                .filter(p -> q == null || q.isBlank()
                        || p.getName().toLowerCase().contains(q.toLowerCase())
                        || p.getLocation().toLowerCase().contains(q.toLowerCase()))
                .filter(p -> type == null || type.equals("All") || p.getType().equals(type))
                .filter(p -> maxPrice == null || p.getPrice() <= maxPrice)
                .map(Mapper::property).toList();
    }

    @GetMapping("/{id}")
    public PropertyDto one(@PathVariable Long id) {
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property not found"));
        return Mapper.property(p);
    }

    @GetMapping("/{id}/reviews")
    public List<ReviewDto> listReviews(@PathVariable Long id) {
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property not found"));
        return reviews.findByPropertyOrderByCreatedAtDesc(p).stream().map(Mapper::review).toList();
    }

    @PostMapping("/{id}/reviews")
    public ReviewDto addReview(@PathVariable Long id, @AuthenticationPrincipal User user,
                               @Valid @RequestBody ReviewRequest req) {
        if (user.getRole() != Role.CUSTOMER) throw ApiException.forbidden("Only customers can review stays");
        Property p = properties.findById(id).orElseThrow(() -> ApiException.notFound("Property not found"));
        if (!bookings.existsByUserAndPropertyAndStatusNot(user, p, "Cancelled"))
            throw ApiException.forbidden("Book this stay before reviewing it");
        if (reviews.existsByPropertyAndUser(p, user)) throw ApiException.conflict("You already reviewed this stay");

        Review r = new Review();
        r.setProperty(p);
        r.setUser(user);
        r.setRating(req.rating());
        r.setComment(req.comment());
        reviews.save(r);

        double total = p.getRating() * p.getReviewsCount() + req.rating();
        p.setReviewsCount(p.getReviewsCount() + 1);
        p.setRating(Math.round(total / p.getReviewsCount() * 10.0) / 10.0);
        properties.save(p);
        return Mapper.review(r);
    }
}
