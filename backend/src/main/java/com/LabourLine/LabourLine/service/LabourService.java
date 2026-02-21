package com.LabourLine.LabourLine.service;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.LabourLine.LabourLine.dto.BidRequest;
import com.LabourLine.LabourLine.entity.Bid;
import com.LabourLine.LabourLine.entity.LabourDetails;
import com.LabourLine.LabourLine.entity.LabourLocation;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.entity.Work;
import com.LabourLine.LabourLine.entity.type.WorkStatus;
import com.LabourLine.LabourLine.repository.BidRepository;
import com.LabourLine.LabourLine.repository.LabourLocationRepository;
import com.LabourLine.LabourLine.repository.LabourRepository;
import com.LabourLine.LabourLine.repository.UserRepository;
import com.LabourLine.LabourLine.repository.WorkRepository;

import jakarta.transaction.Transactional;

@Service
public class LabourService {

    private final LabourRepository labourRepository;
    private final WorkRepository workRepository;
    private final UserRepository userRepository;
    private final LabourLocationRepository labourLocationRepository;
@Autowired
    private BidRepository bidRepository;
    public LabourService(LabourRepository labourRepository, UserRepository userRepository,
            LabourLocationRepository labourLocationRepository, WorkRepository workRepository) {
        this.labourRepository = labourRepository;
        this.userRepository = userRepository;
        this.labourLocationRepository = labourLocationRepository;
        this.workRepository = workRepository;
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

    // Ensure this is injected

    public Bid placeBid(BidRequest request) {
        // 1. Fetch Job
        Work work = workRepository.findById(request.getWorkId())
                .orElseThrow(() -> new RuntimeException("Job not found"));

        // 2. Validation
        if (!work.isBiddingAllowed()) {
            throw new RuntimeException("This job is Fixed Price only. You cannot bid.");
        }
        if (work.getStatus() != WorkStatus.OPEN) {
            throw new RuntimeException("This job is no longer accepting bids.");
        }

        // 3. Fetch User (using the ID from the DTO)
        User user = userRepository.findById(request.getLabourId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 4. Extract LabourDetails from the User
        // Since User has @OneToOne with LabourDetails, we can just get it.
        LabourDetails labour = user.getLabourDetails();

        if (labour == null) {
            throw new RuntimeException("This user does not have a Labour Profile. Please complete your profile first.");
        }

        // 5. Create and Save Bid
        Bid newBid = new Bid();
        newBid.setWork(work);
        newBid.setLabour(labour); // Now passing the correct LabourDetails entity
        newBid.setBidAmount(request.getBidAmount());
        newBid.setComment(request.getComment());
        newBid.setStatus("PENDING");

        return bidRepository.save(newBid);
    }

}