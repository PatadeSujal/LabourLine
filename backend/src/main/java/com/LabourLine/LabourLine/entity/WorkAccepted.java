package com.LabourLine.LabourLine.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

import com.LabourLine.LabourLine.entity.type.WorkAcceptedStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Data
public class WorkAccepted {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relationship to the Work being done
    @ManyToOne
    @JoinColumn(name = "work_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Work work;

    // Relationship to the Labour who accepted it
    @ManyToOne
    @JoinColumn(name = "labour_id", nullable = false)
    private User labour;

    private LocalDateTime acceptedAt;

     @Enumerated(EnumType.STRING)
    private WorkAcceptedStatus status;
}
