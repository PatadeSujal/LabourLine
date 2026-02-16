package com.LabourLine.LabourLine.entity;

import java.time.LocalDateTime;

import aj.org.objectweb.asm.Label;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class LabourLocation {
    @Id
    private Long labourId; // Use the same ID as the Labour entity
    
    private Double lastLatitude;
    private Double lastLongitude;
    private LocalDateTime lastUpdated;

    @OneToOne
    @MapsId
    private LabourDetails labour;
}
