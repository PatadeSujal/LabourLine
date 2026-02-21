package com.LabourLine.LabourLine.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "bids")
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bid_amount", nullable = false)
    private Double bidAmount;

    private String comment; // e.g., "I can come in 10 mins"

    // Status: PENDING, ACCEPTED, REJECTED
    private String status = "PENDING"; 

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // RELATIONSHIPS

    @ManyToOne
    @JoinColumn(name = "work_id", nullable = false)
    @JsonIgnore
    private Work work;

    // Linking to your existing LabourDetails table
    @ManyToOne
    @JoinColumn(name = "labour_id", nullable = false)
    private LabourDetails labour; 
}