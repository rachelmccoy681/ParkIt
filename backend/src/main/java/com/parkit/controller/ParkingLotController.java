package com.parkit.controller;

import com.parkit.dto.ParkingFloorResponse;
import com.parkit.dto.ParkingLotResponse;
import com.parkit.repository.ParkingFloorRepository;
import com.parkit.repository.ParkingLotRepository;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lots")
public class ParkingLotController {

    private final ParkingLotRepository lotRepository;
    private final ParkingFloorRepository floorRepository;

    public ParkingLotController(ParkingLotRepository lotRepository,
                                  ParkingFloorRepository floorRepository) {
        this.lotRepository = lotRepository;
        this.floorRepository = floorRepository;
    }

    @GetMapping
    public ResponseEntity<List<ParkingLotResponse>> getAll() {
        return ResponseEntity.ok(lotRepository.findAll().stream()
                .map(ParkingLotResponse::from).toList());
    }

    @GetMapping("/{lotId}")
    public ResponseEntity<ParkingLotResponse> getById(@PathVariable String lotId) {
        return ResponseEntity.ok(lotRepository.findById(lotId)
                .map(ParkingLotResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found")));
    }

    @GetMapping("/{lotId}/floors")
    public ResponseEntity<List<ParkingFloorResponse>> getFloors(@PathVariable String lotId) {
        return ResponseEntity.ok(floorRepository.findByLotId(lotId).stream()
                .map(ParkingFloorResponse::from).toList());
    }
}
