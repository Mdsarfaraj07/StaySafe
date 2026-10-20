package com.staysafe.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public final class Dtos {
    private Dtos() {}

    // ---- auth ----
    public record RegisterRequest(@NotBlank String name, @NotBlank @Email String email,
                                  @NotBlank @Size(min = 6) String password, String phone, String role) {}
    public record LoginRequest(@NotBlank String email, @NotBlank String password) {}
    public record UpdateProfileRequest(String name, String phone) {}
    public record UserDto(Long id, String name, String email, String phone, String role, boolean enabled) {}
    public record AuthResponse(String token, UserDto user) {}

    // ---- property ----
    public record PropertyRequest(@NotBlank String name, @NotBlank String type, @NotBlank String location,
                                  @NotNull @Min(1) Integer price, Integer deposit, String description,
                                  List<String> amenities, List<String> images) {}
    public record PropertyDto(Long id, String name, String type, String location, int price, double rating,
                              int reviewsCount, boolean verified, String image, List<String> images,
                              List<String> amenities, String description, String status, int bookingsCount,
                              String owner, String ownerPhone, int deposit) {}

    // ---- booking ----
    public record BookingRequest(@NotNull Long propertyId, @NotNull LocalDate checkIn, @NotNull LocalDate checkOut,
                                 String guests, String paymentMethod) {}
    public record BookingDto(String id, Long dbId, Long propertyId, String propertyName, String location,
                             LocalDate checkIn, LocalDate checkOut, String guests, int amount, String status,
                             String image, String paymentMethod, String paymentRef,
                             String customerName, String customerPhone) {}

    // ---- support ----
    public record TicketRequest(@NotBlank String subject, String message) {}
    public record TicketUpdate(String response, String status) {}
    public record TicketDto(String id, Long dbId, String subject, String message, String status,
                            String response, String customerName, String date) {}

    // ---- notifications / reviews ----
    public record NotificationDto(Long id, String title, String message, String type, boolean unread, String time) {}
    public record ReviewRequest(@Min(1) @Max(5) int rating, String comment) {}
    public record ReviewDto(Long id, String userName, int rating, String comment, String date) {}
}
