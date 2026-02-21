package com.LabourLine.LabourLine.controller;

import com.LabourLine.LabourLine.entity.Work;
import com.LabourLine.LabourLine.entity.WorkAccepted;
import com.LabourLine.LabourLine.entity.type.WorkAcceptedStatus;
import com.LabourLine.LabourLine.entity.type.WorkStatus;
import com.LabourLine.LabourLine.repository.WorkAcceptedRepository;
import com.LabourLine.LabourLine.repository.WorkRepository;
import com.LabourLine.LabourLine.service.BidResponseDto;
import com.LabourLine.LabourLine.service.EmployerService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/employer")
@CrossOrigin(origins = "*")
public class EmployerController {

    @Autowired
    private WorkRepository workRepository;
    @Autowired
    private EmployerService employerService;
    @Autowired
    private WorkAcceptedRepository workAcceptedRepository;

    @PutMapping("/complete-work")
    public ResponseEntity<?> completeWork(@RequestParam("workId") Long workId,
            @RequestParam("employerId") Long employerId) {

        // 1. Find the Work
        Optional<Work> workOpt = workRepository.findById(workId);
        if (workOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Work not found");
        }
        Work work = workOpt.get();

        if (!work.getEmployer().getId().equals(employerId)) {
            return ResponseEntity.status(403).body("Unauthorized: You are not the employer for this work.");
        }

        Optional<WorkAccepted> acceptedOpt = workAcceptedRepository.findByWorkId(workId);
        if (acceptedOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("This work has not been accepted by any labour yet.");
        }
        WorkAccepted workAccepted = acceptedOpt.get();

        work.setStatus(WorkStatus.COMPLETED);
        workRepository.save(work);

        workAccepted.setStatus(WorkAcceptedStatus.COMPLETED);

        workAcceptedRepository.save(workAccepted);

        return ResponseEntity.ok("Work marked as completed. Payment released.");
    }

    @GetMapping("/work-status/{workId}")
    public ResponseEntity<?> getWorkStatus(@RequestParam("workId") Long workId) {
        Optional<WorkAccepted> acceptedOpt = workAcceptedRepository.findByWorkId(workId);
        if (acceptedOpt.isPresent()) {
            return ResponseEntity.ok(acceptedOpt.get());
        }

        Optional<Work> workOpt = workRepository.findById(workId);
        if (workOpt.isPresent()) {
            return ResponseEntity.ok(java.util.Map.of("work", workOpt.get(), "status", "OPEN"));
        }

        return ResponseEntity.notFound().build();
    }

    @GetMapping("/bids/{workId}")
    public ResponseEntity<List<BidResponseDto>> getBids(@PathVariable Long workId) {
        return ResponseEntity.ok(employerService.getBidsForWork(workId));
    }

   @PutMapping("/confirm-bid/{bidId}") // Assuming this is a PUT or POST
    public ResponseEntity<?> confirmBid(@PathVariable Long bidId) {
        try {
            // Service now returns the custom Map containing the bid and labourId
            Map<String, Object> confirmedBidData = employerService.confirmBid(bidId); 
            
            return ResponseEntity.ok(confirmedBidData); // Returns { "id": 5, "labourId": 2, ... }
        } catch (Exception e) {
            // Return error as JSON so React Native can parse it properly
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}