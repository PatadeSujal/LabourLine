package com.LabourLine.LabourLine.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.LabourLine.LabourLine.entity.LabourDetails;

import jakarta.transaction.Transactional;
@Modifying 
    @Transactional
@Repository
public interface LabourRepository extends JpaRepository<LabourDetails, Long>{
    @Query("UPDATE LabourDetails l SET l.skills = :skills WHERE l.user.id = :userId")
    int updateSkillsByUserId(@Param("userId") Long userId, @Param("skills") String skills);
}
