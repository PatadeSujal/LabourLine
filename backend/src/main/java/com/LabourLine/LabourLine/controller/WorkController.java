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

@RestController
public class WorkController {

    @Autowired
    private WorkRepository workRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkAcceptedRepository workAcceptedRepository;

    @PostMapping("/employer/post-work")
    public ResponseEntity<?> postWork(@RequestBody WorkDto workDto) {

        // 1. Find the Employer (User) who is posting this
        Optional<User> employerOpt = userRepository.findById(workDto.getEmployerId());

        if (employerOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Employer not found with ID: " + workDto.getEmployerId());
        }

        // 2. Map DTO to Entity
        Work work = new Work();
        work.setEmployer(employerOpt.get());
        work.setTitle(workDto.getTitle());
        work.setDescription(workDto.getDescription());
        work.setSkillsRequired(workDto.getSkillsRequired());
        work.setEarning(workDto.getEarning());
        work.setLocation(workDto.getLocation());
        work.setImage(workDto.getImage());
        work.setLatitude(workDto.getLatitude());
        work.setLongitude(workDto.getLongitude());

        // 3. Set Default Status
        work.setStatus(WorkStatus.OPEN);

        // 4. Save to Database
        Work savedWork = workRepository.save(work);

        return ResponseEntity.ok(savedWork);
    }

    @GetMapping("/labour/open-work")
    public ResponseEntity<List<Work>> getOpenWork() {
        // Fetch only jobs where status is OPEN
        List<Work> openWorks = workRepository.findByStatus(WorkStatus.OPEN);
        return ResponseEntity.ok(openWorks);
    }

    @GetMapping("/employer/{employerId}/my-open-work")
    public ResponseEntity<List<Work>> getMyOpenWork(@PathVariable("employerId") Long employerId) {
        List<Work> myWorks = workRepository.findByEmployerId(employerId);
        System.out.println(myWorks);
        return ResponseEntity.ok(myWorks);
    }

    @PostMapping("/labour/accept-work")
    public ResponseEntity<?> acceptWork(@RequestParam("labourId") Long labourId, @RequestParam("workId") Long workId) {
        System.out.println("Hello");

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