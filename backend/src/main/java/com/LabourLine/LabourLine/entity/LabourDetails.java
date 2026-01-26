package com.LabourLine.LabourLine.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class LabourDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    @JsonIgnore
    private User user;

    private Double rating = 0.0;          // Initialized to 0.0
    private Integer jobsDone = 0;         // Initialized to 0
    private Integer experience = 0;       // Initialized to 0
    
    private String skills = "";           // Empty string instead of null
    private Double totalEarnings = 0.0;   // Initialized to 0.0
    private String language = "English";  // Default language
}
