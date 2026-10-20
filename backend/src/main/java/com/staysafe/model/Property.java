package com.staysafe.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter @NoArgsConstructor
public class Property {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;        // PG | Flat | Co-living
    private String location;
    private int price;
    private int deposit;
    private double rating = 0;
    private int reviewsCount = 0;
    private boolean verified = false;

    @Column(length = 1000)
    private String image;

    @Convert(converter = StringListConverter.class)
    @Column(length = 4000)
    private List<String> images = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(length = 1000)
    private List<String> amenities = new ArrayList<>();

    @Column(length = 2000)
    private String description;

    private String status = "Under Review";   // Under Review | Active | Rejected
    private int bookingsCount = 0;

    @ManyToOne(optional = false)
    private User owner;

    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { createdAt = LocalDateTime.now(); }
}
