package com.LabourLine.LabourLine.dto;


import lombok.Data;

@Data
public class WorkDto {
    private String title;
    private String description;
    private String skillsRequired;
    private Double earning;
    private String location;
    private String image;
     private Double latitude;  // e.g., 18.5204
    private Double longitude; // e.g., 73.8567
    // We need this to know WHO is posting the work
    private Long employerId; 
}