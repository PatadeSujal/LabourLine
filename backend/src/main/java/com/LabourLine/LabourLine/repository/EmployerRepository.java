package com.LabourLine.LabourLine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.LabourLine.LabourLine.entity.EmployerDetails;

@Repository
public interface EmployerRepository extends JpaRepository<EmployerDetails, Long>{
    
}
