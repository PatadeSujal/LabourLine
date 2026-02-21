package com.LabourLine.LabourLine.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.LabourLine.LabourLine.dto.BidRequest;
import com.LabourLine.LabourLine.entity.Bid;
import com.LabourLine.LabourLine.entity.LabourDetails;
import com.LabourLine.LabourLine.entity.LabourLocation;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.entity.Work;
import com.LabourLine.LabourLine.entity.WorkAccepted;
import com.LabourLine.LabourLine.entity.type.WorkAcceptedStatus;
import com.LabourLine.LabourLine.repository.BidRepository;
import com.LabourLine.LabourLine.repository.UserRepository;
import com.LabourLine.LabourLine.repository.WorkAcceptedRepository; // 1. Import this
import com.LabourLine.LabourLine.service.AuthService;
import com.LabourLine.LabourLine.service.LabourService;
import com.LabourLine.LabourLine.utils.JwtUtils;

@RestController
@RequestMapping("/labour")
@CrossOrigin(origins = "*")
public class LabourController {

    private final LabourService labourService;
    private final UserRepository userRepository;
    private final WorkAcceptedRepository workAcceptedRepository; // 2. Declare the repository
    private final JwtUtils jwtService;
    private final BidRepository bidRepository;

    // 3. Update Constructor to inject ALL dependencies
    public LabourController(LabourService labourService,
            UserRepository userRepository,
            WorkAcceptedRepository workAcceptedRepository, JwtUtils jwtService, BidRepository bidRepository) {
        this.labourService = labourService;
        this.userRepository = userRepository;
        this.workAcceptedRepository = workAcceptedRepository;
        this.jwtService = jwtService;
        this.bidRepository = bidRepository;
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
        System.out.println("Labour id " + labourId);
        Optional<User> labourOpt = userRepository.findById(labourId);
        System.out.println("This is labour " + labourOpt);
        if (labourOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Labour not found");
        }

        Optional<WorkAccepted> activeWork = workAcceptedRepository.findByLabourIdAndStatus(labourId,
                WorkAcceptedStatus.ACCEPTED);

        if (activeWork.isPresent()) {
            return ResponseEntity.ok(activeWork.get());
        } else {
            return ResponseEntity.noContent().build();
        }
    }

    @PostMapping("/update-location")
    public ResponseEntity<?> updateLocation(@RequestBody LabourLocation request) {
        System.out.println("Last Location " + request.getLastLatitude());
        // Update the Labourer record with new Lat/Lng
        labourService.updateCurrentLocation(
                request.getLabourId(),
                73.8636,
                18.5018);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{labourId}")
    public ResponseEntity<LabourLocation> getLabourLocation(@PathVariable Long labourId) {
        // 1. Fetch the location
        LabourLocation loc = labourService.getLabourLocation(labourId);

        // 2. CHECK if it exists BEFORE accessing data
        if (loc != null) {
            System.out.println("Labour Found! Latitude: " + loc.getLastLatitude());
            return ResponseEntity.ok(loc);
        }

        // 3. If null, print that it wasn't found and return 404
        System.out.println("No location found for Labour ID: " + labourId);
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/bid")
    public ResponseEntity<?> placeBid(@RequestBody BidRequest request) {
        System.out.println("Bidding started");
        try {
            Bid bid = labourService.placeBid(request);
            return ResponseEntity.ok(bid);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/check-accepted-bids")
    public ResponseEntity<?> checkAcceptedBids(@RequestHeader("Authorization") String token) {
        String jwt = token.substring(7);

        // 2. Extract ID
        Long workerId = jwtService.extractId(jwt);

        List<Bid> acceptedBids = bidRepository.findByLabourIdAndStatus(workerId, "ACCEPTED");

        if (!acceptedBids.isEmpty()) {
            // Return the first accepted job found
            Work acceptedWork = acceptedBids.get(0).getWork();
            return ResponseEntity.ok(acceptedWork);
        }

        return ResponseEntity.noContent().build(); // 204 No Content (Nothing new)
    }
}