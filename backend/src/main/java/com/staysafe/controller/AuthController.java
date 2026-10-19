package com.staysafe.controller;

import com.staysafe.config.JwtService;
import com.staysafe.dto.Dtos.*;
import com.staysafe.dto.Mapper;
import com.staysafe.exception.ApiException;
import com.staysafe.model.Role;
import com.staysafe.model.User;
import com.staysafe.repo.UserRepository;
import com.staysafe.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final NotificationService notifications;

    public AuthController(UserRepository users, PasswordEncoder encoder, JwtService jwt, NotificationService notifications) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.notifications = notifications;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw ApiException.conflict("Email is already registered");

        User u = new User();
        u.setName(req.name().trim());
        u.setEmail(email);
        u.setPassword(encoder.encode(req.password()));
        u.setPhone(req.phone());
        u.setRole("OWNER".equalsIgnoreCase(req.role()) ? Role.OWNER : Role.CUSTOMER); // ADMIN can never self-register
        users.save(u);

        notifications.notify(u, "Welcome to StaySafe!",
                "Explore verified PGs, rooms, and flats with safety guarantees.", "system");
        return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), Mapper.user(u));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        User u = users.findByEmail(req.email().trim().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        if (!encoder.matches(req.password(), u.getPassword()))
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        if (!u.isEnabled()) throw ApiException.forbidden("This account has been disabled");
        return new AuthResponse(jwt.generate(u.getEmail(), u.getRole().name()), Mapper.user(u));
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal User user) {
        return Mapper.user(user);
    }

    @PutMapping("/me")
    public UserDto update(@AuthenticationPrincipal User user, @RequestBody UpdateProfileRequest req) {
        if (req.name() != null && !req.name().isBlank()) user.setName(req.name().trim());
        if (req.phone() != null) user.setPhone(req.phone());
        return Mapper.user(users.save(user));
    }
}
