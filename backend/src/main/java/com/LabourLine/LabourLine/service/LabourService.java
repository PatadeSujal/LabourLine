package com.LabourLine.LabourLine.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.LabourLine.LabourLine.entity.LabourDetails;
import com.LabourLine.LabourLine.entity.LabourLocation;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.repository.LabourLocationRepository;
import com.LabourLine.LabourLine.repository.LabourRepository;
import com.LabourLine.LabourLine.repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class LabourService {

    private final LabourRepository labourRepository;
    private final UserRepository userRepository;
    private final LabourLocationRepository labourLocationRepository;

    public LabourService(LabourRepository labourRepository, UserRepository userRepository,
            LabourLocationRepository labourLocationRepository) {
        this.labourRepository = labourRepository;
        this.userRepository = userRepository;
        this.labourLocationRepository = labourLocationRepository;
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

    @Transactional
    public void updateCurrentLocation(Long labourId, Double lat, Double lng) {
        // 1. Find existing location record or create a new one
        LabourLocation location = labourLocationRepository.findById(labourId)
                .orElseGet(() -> {
                    LabourLocation newLoc = new LabourLocation();
                    // Link to the main Labour entity
                    newLoc.setLabour(labourRepository.findById(labourId)
                            .orElseThrow(() -> new RuntimeException("Labourer not found")));
                    return newLoc;
                });

        // 2. Update the dynamic data
        location.setLastLatitude(lat);
        location.setLastLongitude(lng);
        location.setLastUpdated(LocalDateTime.now());

        // 3. Save to database
        labourLocationRepository.save(location);
    }

    public LabourLocation getLabourLocation(Long labourId) {
        return labourLocationRepository.findById(labourId).orElse(null);
    }

}