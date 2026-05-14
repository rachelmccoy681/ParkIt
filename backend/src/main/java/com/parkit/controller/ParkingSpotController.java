package com.parkit.controller;

import com.parkit.dto.ParkingSpotResponse;
import com.parkit.dto.UpdateSpotStatusRequest;
import com.parkit.service.ParkingSpotService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ParkingSpotController {

    private final ParkingSpotService spotService;

    public ParkingSpotController(ParkingSpotService spotService) {
        this.spotService = spotService;
    }

    @GetMapping("/api/floors/{floorId}/spots")
    public ResponseEntity<List<ParkingSpotResponse>> getByFloor(@PathVariable String floorId) {
        return ResponseEntity.ok(spotService.getByFloor(floorId).stream()
                .map(ParkingSpotResponse::from).toList());
    }

    @GetMapping("/api/floors/{floorId}/spots/available")
    public ResponseEntity<List<ParkingSpotResponse>> getAvailableByFloor(@PathVariable String floorId) {
        return ResponseEntity.ok(spotService.getAvailableByFloor(floorId).stream()
                .map(ParkingSpotResponse::from).toList());
    }

    @GetMapping("/api/spots/{spotId}")
    public ResponseEntity<ParkingSpotResponse> getById(@PathVariable String spotId) {
        return ResponseEntity.ok(ParkingSpotResponse.from(spotService.getById(spotId)));
    }

    @PutMapping("/api/spots/{spotId}/status")
    public ResponseEntity<Void> updateStatus(@PathVariable String spotId,
                                              @Valid @RequestBody UpdateSpotStatusRequest request) {
        spotService.updateStatus(spotId, request.status());
        return ResponseEntity.noContent().build();
    }
}
