package com.LabourLine.LabourLine.dto;


import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class WorkDto {
    private String title;
    private String description;
    private String skillsRequired; // Category
    private Double budget;         // The Amount
    @JsonProperty("isBiddingAllowed")
    private boolean isBiddingAllowed; // <--- CRITICAL FIELD
    private String location;
    private Double latitude;
    private Double longitude;
    private String image;
    private String audioUrl;
    private Long employerId;
}