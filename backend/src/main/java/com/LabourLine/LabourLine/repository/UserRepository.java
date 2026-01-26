package com.LabourLine.LabourLine.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LabourLine.LabourLine.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhoneNo(String phoneNo);
}
