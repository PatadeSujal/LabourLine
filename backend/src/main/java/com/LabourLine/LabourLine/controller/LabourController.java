package com.LabourLine.LabourLine.controller;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.LabourLine.LabourLine.entity.LabourDetails;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.entity.WorkAccepted;
import com.LabourLine.LabourLine.entity.type.WorkAcceptedStatus;
import com.LabourLine.LabourLine.repository.UserRepository;
import com.LabourLine.LabourLine.repository.WorkAcceptedRepository; // 1. Import this
import com.LabourLine.LabourLine.service.LabourService;

@RestController
@RequestMapping("/labour")
@CrossOrigin(origins = "*")
public class LabourController {

    private final LabourService labourService;
    private final UserRepository userRepository;
    private final WorkAcceptedRepository workAcceptedRepository; // 2. Declare the repository

    // 3. Update Constructor to inject ALL dependencies
    public LabourController(LabourService labourService, 
                            UserRepository userRepository, 
                            WorkAcceptedRepository workAcceptedRepository) {
        this.labourService = labourService;
        this.userRepository = userRepository;
        this.workAcceptedRepository = workAcceptedRepository;
    }

    @PutMapping("/{userId}/skills")
    public ResponseEntity<?> updateSkills(@PathVariable("userId") Long userId, @RequestBody String skills) {
        try {
            LabourDetails updatedLabour = labourService.updateLabourSkillsByUserId(userId, skills);
            return ResponseEntity.ok(updatedLabour);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @GetMapping("/active-work/{labourId}")
    public ResponseEntity<?> getActiveWork(@PathVariable Long labourId) {
        // Check if labour exists
        Optional<User> labourOpt = userRepository.findById(labourId);
        if (labourOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Labour not found");
        }

        // Check for active work
        // Now this will work because workAcceptedRepository is injected
        Optional<WorkAccepted> activeWork = workAcceptedRepository.findByLabourIdAndStatus(labourId, WorkAcceptedStatus.ACCEPTED);

        if (activeWork.isPresent()) {
            return ResponseEntity.ok(activeWork.get());
        } else {
            // Return 204 No Content if they are free
            return ResponseEntity.noContent().build();
        }
    }
}