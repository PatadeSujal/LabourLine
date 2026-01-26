package com.LabourLine.LabourLine.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.LabourLine.LabourLine.entity.Work;
import com.LabourLine.LabourLine.entity.type.WorkStatus;

public interface WorkRepository extends JpaRepository<Work, Long> {

    List<Work> findByStatus(WorkStatus status);
    List<Work> findByEmployerId(Long employerId);
} 
