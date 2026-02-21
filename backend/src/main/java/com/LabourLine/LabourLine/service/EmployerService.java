package com.LabourLine.LabourLine.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.LabourLine.LabourLine.entity.Bid;
import com.LabourLine.LabourLine.entity.Work;
import com.LabourLine.LabourLine.entity.type.WorkStatus;
import com.LabourLine.LabourLine.repository.BidRepository;
import com.LabourLine.LabourLine.repository.WorkRepository;

@Service
public class EmployerService {

    @Autowired
    private BidRepository bidRepository;
    @Autowired
    private WorkRepository workRepository;

    // 1. GET ALL BIDS FOR A JOB
    public List<BidResponseDto> getBidsForWork(Long workId) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new RuntimeException("Work not found"));

        return work.getBids().stream().map(bid -> {
            BidResponseDto dto = new BidResponseDto();
            dto.setId(bid.getId());
            dto.setBidAmount(bid.getBidAmount());
            dto.setComment(bid.getComment());
            dto.setStatus(bid.getStatus());
            
            // Map Worker Details
            if (bid.getLabour() != null) {
                dto.setWorkerName(bid.getLabour().getUser().getName()); 
                dto.setWorkerId(bid.getLabour().getId());
            }
            return dto;
        }).collect(Collectors.toList());
    }

    // 2. CONFIRM A SPECIFIC BID
    // In EmployerService.java

   // Change return type from Work to Map<String, Object>
  public Map<String, Object> confirmBid(Long bidId) {
        // 1. Fetch the Bid
        Bid selectedBid = bidRepository.findById(bidId)
                .orElseThrow(() -> new RuntimeException("Bid not found"));

        Work work = selectedBid.getWork();
        work.setAcceptedLabour(selectedBid.getLabour().getUser());
        // 2. Validation: Is the job still open? (Read-only check)
        if (work.getStatus() != WorkStatus.OPEN) {
            throw new RuntimeException("Job is already assigned to someone else!");
        }

        // --- WORK TABLE UPDATES REMOVED HERE ---
        // (Delegated to acceptWorkApi as requested)

        // 3. Update the Selected Bid
        selectedBid.setStatus("ACCEPTED");
        
        bidRepository.save(selectedBid);

        // 4. Reject all other bids for this job (Cleanup)
        List<Bid> allBids = work.getBids();
        for (Bid bid : allBids) {
            if (!bid.getId().equals(bidId)) {
                bid.setStatus("REJECTED");
                bidRepository.save(bid);
            }
        }

        // 5. BUILD AND RETURN THE CUSTOM BID DATA
        Map<String, Object> bidData = new HashMap<>();
        bidData.put("id", selectedBid.getId()); 
        bidData.put("bidAmount", selectedBid.getBidAmount());
        bidData.put("status", selectedBid.getStatus());
        bidData.put("workId", work.getId());
        
        // This is the crucial ID your frontend needs for acceptWorkApi
        bidData.put("labourId", selectedBid.getLabour().getUser().getId()) ;

        return bidData; 
    }
}
