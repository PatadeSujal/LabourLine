package com.LabourLine.LabourLine.controller;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.LabourLine.LabourLine.entity.EmployerDetails;
import com.LabourLine.LabourLine.entity.LabourDetails;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}/labour-profile")
public ResponseEntity<?> getLabourProfile(@PathVariable("id") Long id) {
    Optional<User> userOpt = userRepository.findById(id);

    if (userOpt.isEmpty()) {
        return ResponseEntity.badRequest().body("User not found");
    }

    User user = userOpt.get();
    LabourDetails details = user.getLabourDetails();
    
    if (details == null) {
        return ResponseEntity.badRequest().body("This user does not have a Labour Profile.");
    }

    // Create a custom response map to include both the details and the user info
    Map<String, Object> response = new HashMap<>();
    response.put("id", details.getId());
    response.put("rating", details.getRating());
    response.put("jobsDone", details.getJobsDone());
    response.put("experience", details.getExperience());
    response.put("skills", details.getSkills());
    response.put("totalEarnings", details.getTotalEarnings());
    response.put("language", details.getLanguage());
    
    // Explicitly add the user details
    Map<String, Object> userDetails = new HashMap<>();
    userDetails.put("name", user.getName());
    userDetails.put("phoneNo", user.getPhoneNo());
    userDetails.put("age", user.getAge());
    
    response.put("user", userDetails);

    return ResponseEntity.ok(response);
}

    @GetMapping("/{id}/employer-profile")
    public ResponseEntity<?> getEmployerProfile(@PathVariable("id") Long id) {
        Optional<User> userOpt = userRepository.findById(id);

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }

        EmployerDetails details = userOpt.get().getEmployerDetails();

        if (details == null) {
            return ResponseEntity.badRequest().body("This user does not have an Employer Profile.");
        }

        return ResponseEntity.ok(details);
    }
}