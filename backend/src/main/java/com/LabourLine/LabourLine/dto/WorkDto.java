package com.LabourLine.LabourLine.dto;


import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class WorkDto {
    private String title;
    private String description;
    private String skillsRequired;
    private Double earning;
    private String location;
    private String image;
     private Double latitude;  // e.g., 18.5204
    private Double longitude; // e.g., 73.8567
    private String audioUrl;
    private Long employerId; 
}