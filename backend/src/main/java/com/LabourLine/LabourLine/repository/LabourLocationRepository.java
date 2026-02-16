package com.LabourLine.LabourLine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.LabourLine.LabourLine.entity.LabourLocation;

@Repository
public interface LabourLocationRepository extends JpaRepository<LabourLocation, Long> {
}
