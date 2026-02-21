// src/main/java/com/LabourLine/dto/BidRequest.java
package com.LabourLine.LabourLine.dto;

import lombok.Data;

@Data
public class BidRequest {
    private Long workId;
    private Long labourId; // Or extract from JWT token
    private Double bidAmount;
    private String comment;
}
