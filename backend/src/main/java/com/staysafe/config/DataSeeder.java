package com.staysafe.config;

import com.staysafe.model.*;
import com.staysafe.repo.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Seeds demo data on first run (only when the users table is empty). */
@Component
public class DataSeeder implements CommandLineRunner {
    private final UserRepository users;
    private final PropertyRepository properties;
    private final BookingRepository bookings;
    private final FavoriteRepository favorites;
    private final NotificationRepository notifications;
    private final ReviewRepository reviews;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository users, PropertyRepository properties, BookingRepository bookings,
                      FavoriteRepository favorites, NotificationRepository notifications,
                      ReviewRepository reviews, PasswordEncoder encoder) {
        this.users = users;
        this.properties = properties;
        this.bookings = bookings;
        this.favorites = favorites;
        this.notifications = notifications;
        this.reviews = reviews;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) return;

        User admin = user("System Admin", "admin@staysafe.com", "Admin@123", "+91 90000 00000", Role.ADMIN);
        User rahul = user("Rahul Verma", "rahul@staysafe.com", "Owner@123", "+91 98765 43210", Role.OWNER);
        User vikram = user("Vikram Patel", "vikram@staysafe.com", "Owner@123", "+91 91234 56789", Role.OWNER);
        User priya = user("Priya Sharma", "priya@staysafe.com", "Customer@123", "+91 99999 11111", Role.CUSTOMER);

        String i1 = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80";
        String i2 = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80";
        String i3 = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80";
        String i4 = "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80";
        String i5 = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80";

        Property green = prop("Green Valley PG", "PG", "Koramangala, Bangalore", 7500, 15000, 4.5, 120, true, "Active", rahul,
                List.of(i1, i2, i3, i4), List.of("WiFi", "AC", "Food Included", "Laundry", "Parking"),
                "Green Valley PG offers a safe, comfortable and homely stay with modern amenities. Perfect for students and working professionals.");
        Property urban = prop("Urban Nest Co-living", "Co-living", "Indiranagar, Bangalore", 12000, 24000, 4.7, 98, true, "Active", rahul,
                List.of(i2, i3), List.of("WiFi", "AC", "Gym", "Housekeeping"),
                "Vibrant community living space designed for tech professionals and creators with top-notch coworking and social zones.");
        prop("Skyline Apartments", "Flat", "HSR Layout, Bangalore", 18000, 36000, 4.3, 76, true, "Active", vikram,
                List.of(i5), List.of("WiFi", "AC", "Parking", "Housekeeping"),
                "Spacious independent 1BHK apartments equipped with high-speed internet and modular kitchen facilities.");
        prop("Maple Residency", "PG", "BTM Layout, Bangalore", 9500, 19000, 4.2, 64, false, "Under Review", rahul,
                List.of(i3), List.of("WiFi", "AC", "Food Included", "Laundry"),
                "Cozy rooms with home-cooked meals and 24/7 security in a peaceful neighborhood.");

        booking("BK-9082", priya, green, LocalDate.now().plusDays(10), LocalDate.now().plusDays(40), "Confirmed");
        booking("BK-7612", priya, urban, LocalDate.now().minusDays(80), LocalDate.now().minusDays(50), "Confirmed"); // shows as Completed

        favorite(priya, green);
        favorite(priya, urban);

        review(green, priya, 5, "Clean room, quiet neighborhood, fast Wi-Fi and safe entrance.");

        note(priya, "Welcome to StaySafe!", "Explore verified PGs, rooms, and flats with safety guarantees.", "system");
        note(priya, "Booking Confirmed!", "Your stay at Green Valley PG is locked.", "booking");
        note(rahul, "Verification Queue Update", "Maple Residency docs uploaded! Awaiting final admin approval.", "audit");
        note(rahul, "New Guest Booking", "Priya Sharma booked Green Valley PG.", "booking");
        note(admin, "New Verification Audit Request", "Maple Residency (Rahul Verma) submitted documents for audit.", "audit");
        note(vikram, "Welcome to StaySafe!", "Your Skyline Apartments listing is live.", "system");
    }

    private User user(String name, String email, String pw, String phone, Role role) {
        User u = new User();
        u.setName(name); u.setEmail(email); u.setPassword(encoder.encode(pw)); u.setPhone(phone); u.setRole(role);
        return users.save(u);
    }

    private Property prop(String name, String type, String loc, int price, int dep, double rating, int count,
                          boolean verified, String status, User owner, List<String> images, List<String> amenities, String desc) {
        Property p = new Property();
        p.setName(name); p.setType(type); p.setLocation(loc); p.setPrice(price); p.setDeposit(dep);
        p.setRating(rating); p.setReviewsCount(count); p.setVerified(verified); p.setStatus(status); p.setOwner(owner);
        p.setImages(new ArrayList<>(images)); p.setImage(images.get(0)); p.setAmenities(new ArrayList<>(amenities));
        p.setDescription(desc);
        return properties.save(p);
    }

    private void booking(String code, User u, Property p, LocalDate in, LocalDate out, String status) {
        Booking b = new Booking();
        b.setCode(code); b.setUser(u); b.setProperty(p); b.setCheckIn(in); b.setCheckOut(out);
        b.setGuests("1 Guest"); b.setAmount(p.getPrice()); b.setStatus(status);
        b.setPaymentMethod("upi"); b.setPaymentRef("RZP_SEED" + code.replace("BK-", ""));
        bookings.save(b);
        p.setBookingsCount(p.getBookingsCount() + 1);
        properties.save(p);
    }

    private void favorite(User u, Property p) {
        Favorite f = new Favorite();
        f.setUser(u); f.setProperty(p);
        favorites.save(f);
    }

    private void review(Property p, User u, int rating, String comment) {
        Review r = new Review();
        r.setProperty(p); r.setUser(u); r.setRating(rating); r.setComment(comment);
        reviews.save(r);
    }

    private void note(User u, String title, String msg, String type) {
        Notification n = new Notification();
        n.setUser(u); n.setTitle(title); n.setMessage(msg); n.setType(type);
        notifications.save(n);
    }
}
