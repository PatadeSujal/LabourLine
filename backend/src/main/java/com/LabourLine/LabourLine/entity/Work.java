package com.LabourLine.LabourLine.entity;

import com.LabourLine.LabourLine.entity.type.WorkStatus;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

import java.util.List; // IMPORT THIS!

@Entity
@Data 
@Table(name = "work")
public class Work {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The Employer who posted the work
    @ManyToOne
    @JoinColumn(name = "employer_id", nullable = false)
    private User employer; 

    private String title;
    
    @Column(length = 1000)
    private String description;
    
    private String skillsRequired;
    
    // RENAME 'earning' to 'budget' to match your DTO/Frontend
    // This represents the Fixed Price OR the Opening Bid
    private Double budget; 
    
    private String location; 
    
    // --- LOCATION & MEDIA ---
    private Double latitude;  // e.g., 18.5204
    private Double longitude; // e.g., 73.8567
    private String image; 
    private String audioUrl;

    // --- CRITICAL ADDITION FOR BIDDING ---
    @JsonProperty("isBiddingAllowed")
    @Column(name = "is_bidding_allowed")
    private boolean isBiddingAllowed; // Matches the switch in your App

    // --- STATUS FIX ---
    @Enumerated(EnumType.STRING)
    private WorkStatus status = WorkStatus.OPEN; // FIX: Use Enum constant, not String

    @OneToMany(mappedBy = "work", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<Bid> bids;

    @ManyToOne
    @JoinColumn(name = "accepted_labour_id") // This column will store the winner's User ID
    private User acceptedLabour;
}