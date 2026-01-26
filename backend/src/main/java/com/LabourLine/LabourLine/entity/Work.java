package com.LabourLine.LabourLine.entity;

import com.LabourLine.LabourLine.entity.type.WorkStatus;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
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
    private Double earning;
    
    private String location; // Human-readable address (e.g., "Pune, Maharashtra")
    
    // --- NEW ATTRIBUTES ---
    private Double latitude;  // e.g., 18.5204
    private Double longitude; // e.g., 73.8567
    
    private String image; 

    @Enumerated(EnumType.STRING)
    private WorkStatus status;
}