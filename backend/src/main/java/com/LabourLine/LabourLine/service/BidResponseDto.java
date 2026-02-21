
package com.LabourLine.LabourLine.service;

import lombok.Data;

@Data

public class BidResponseDto {
    private Long id; // Bid ID
    private Double bidAmount;
    private String comment;
    private String workerName;
    private Long workerId;
    private String status; // PENDING, ACCEPTED, REJECTED
}
