package com.LabourLine.LabourLine.service;

import org.springframework.stereotype.Service;

import com.LabourLine.LabourLine.entity.LabourDetails;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.repository.LabourRepository;
import com.LabourLine.LabourLine.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class LabourService {

    private final LabourRepository labourRepository;
    private final UserRepository userRepository;

    public LabourService(LabourRepository labourRepository, UserRepository userRepository) {
        this.labourRepository = labourRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public LabourDetails updateLabourSkillsByUserId(Long userId, String newSkills) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));

        LabourDetails labour = user.getLabourDetails();
        if (labour == null) {
            throw new RuntimeException("Labour profile not found for User ID: " + userId);
        }

        String cleanedSkills = newSkills.replace("\"", "").trim();
        labour.setSkills(cleanedSkills);

        return labourRepository.save(labour);
    }
}