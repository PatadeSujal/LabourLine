package com.LabourLine.LabourLine.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.LabourLine.LabourLine.entity.Bid;

public interface BidRepository extends JpaRepository<Bid, Long>{

    List<Bid> findByLabourIdAndStatus(Long workerId, String string);

}
