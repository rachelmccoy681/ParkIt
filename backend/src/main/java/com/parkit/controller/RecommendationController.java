package com.parkit.controller;

import com.parkit.domain.model.Vehicle;
import com.parkit.dto.RecommendRequest;
import com.parkit.dto.RecommendationResponse;
import com.parkit.repository.VehicleRepository;
import com.parkit.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final VehicleRepository vehicleRepository;

    public RecommendationController(RecommendationService recommendationService,
                                     VehicleRepository vehicleRepository) {
        this.recommendationService = recommendationService;
        this.vehicleRepository = vehicleRepository;
    }

    @PostMapping
    public ResponseEntity<RecommendationResponse> recommend(@Valid @RequestBody RecommendRequest request) {
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        return ResponseEntity.ok(RecommendationResponse.from(recommendationService.recommend(vehicle)));
    }
}
