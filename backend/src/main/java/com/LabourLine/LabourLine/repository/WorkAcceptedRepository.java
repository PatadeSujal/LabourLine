package com.LabourLine.LabourLine.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.LabourLine.LabourLine.entity.WorkAccepted;
import com.LabourLine.LabourLine.entity.type.WorkAcceptedStatus;

public interface WorkAcceptedRepository extends JpaRepository<WorkAccepted, Long> {
    Optional<WorkAccepted> findByLabourIdAndStatus(Long labourId, WorkAcceptedStatus status);
    Optional<WorkAccepted> findByWorkId(Long workId);
}