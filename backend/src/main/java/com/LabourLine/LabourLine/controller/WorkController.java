package com.LabourLine.LabourLine.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.LabourLine.LabourLine.dto.WorkDto;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.entity.Work;
import com.LabourLine.LabourLine.entity.WorkAccepted;
import com.LabourLine.LabourLine.entity.type.WorkAcceptedStatus;
import com.LabourLine.LabourLine.entity.type.WorkStatus;
import com.LabourLine.LabourLine.repository.UserRepository;
import com.LabourLine.LabourLine.repository.WorkAcceptedRepository;
import com.LabourLine.LabourLine.repository.WorkRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
public class WorkController {

    @Autowired
    private WorkRepository workRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkAcceptedRepository workAcceptedRepository;

    @PostMapping("/employer/post-work")
    public ResponseEntity<?> postWork(@RequestBody WorkDto request) {

        // 1. Find the Employer (User) who is posting this
        Optional<User> employerOpt = userRepository.findById(request.getEmployerId());
        if (employerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Employer not found with ID: " + request.getEmployerId());
        }
        User employer = employerOpt.get();

        // 2. Map DTO to Entity
      Work newWork = new Work();
      newWork.setEmployer(employer);
            newWork.setTitle(request.getTitle());
            newWork.setDescription(request.getDescription());
            newWork.setSkillsRequired(request.getSkillsRequired());
            
            // MAP BIDDING FIELDS
            newWork.setBudget(request.getBudget());
            newWork.setBiddingAllowed(request.isBiddingAllowed());
            newWork.setStatus(WorkStatus.OPEN); // Default status

            // Map Location & Media
            newWork.setLocation(request.getLocation());
            newWork.setLatitude(request.getLatitude());
            newWork.setLongitude(request.getLongitude());
            newWork.setImage(request.getImage());
            newWork.setAudioUrl(request.getAudioUrl());
        Work savedWork = workRepository.save(newWork); 

        return ResponseEntity.ok(savedWork);
    }

   @GetMapping("/labour/open-work")
    public ResponseEntity<List<Work>> getOpenWork(
            @RequestParam(required = false) Double maxDistance,
            @RequestParam(required = false) Double userLat,
            @RequestParam(required = false) Double userLng
    ) {
        // 1. Fetch all OPEN jobs first
        List<Work> openWorks = workRepository.findByStatus(WorkStatus.OPEN);

        // 2. If the frontend sent location filters, apply them
        if (maxDistance != null && userLat != null && userLng != null) {
            openWorks = openWorks.stream()
                    .filter(work -> {
                        // Skip jobs that don't have a location set in the database
                        if (work.getLatitude() == null || work.getLongitude() == null) {
                            return false; 
                        }
                        
                        // Calculate distance in kilometers 
                        double distance = calculateDistance(
                                userLat, userLng, 
                                work.getLatitude(), work.getLongitude()
                        );
                        
                        // Keep only jobs within the max radius
                        return distance <= maxDistance;
                    })
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(openWorks);
    }
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Radius of the earth in kilometers

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Returns distance in kilometers
    }

    @GetMapping("/employer/{employerId}/my-open-work")
    public ResponseEntity<List<Work>> getMyOpenWork(@PathVariable("employerId") Long employerId) {
        List<Work> myWorks = workRepository.findByEmployerId(employerId);
        return ResponseEntity.ok(myWorks);
    }

      @PostMapping("/labour/accept-work")
    public ResponseEntity<?> acceptWork(@RequestParam("labourId") Long labourId, @RequestParam("workId") Long workId) {

        Optional<Work> workOpt = workRepository.findById(workId);
        if (workOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Work not found");
        }
        Work work = workOpt.get();

        if (work.getStatus() != WorkStatus.OPEN) {
            return ResponseEntity.badRequest().body("This work is already accepted or completed.");
        }

        Optional<User> labourOpt = userRepository.findById(labourId);
        if (labourOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Labour not found");
        }

        WorkAccepted workAccepted = new WorkAccepted();
        workAccepted.setWork(work);
        workAccepted.setLabour(labourOpt.get());
        workAccepted.setAcceptedAt(LocalDateTime.now());
        workAccepted.setStatus(WorkAcceptedStatus.ACCEPTED);

        WorkAccepted savedWorkAccepted = workAcceptedRepository.save(workAccepted);

        work.setStatus(WorkStatus.ACCEPTED);
        workRepository.save(work);

        return ResponseEntity.ok(savedWorkAccepted);
    }
}