package com.parkit.controller;

import com.parkit.dto.RecommendRequest;
import com.parkit.dto.RecommendationResponse;
import com.parkit.service.RecommendationService;
import com.parkit.service.VehicleService;
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
    private final VehicleService vehicleService;

    public RecommendationController(RecommendationService recommendationService,
                                     VehicleService vehicleService) {
        this.recommendationService = recommendationService;
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<RecommendationResponse> recommend(@Valid @RequestBody RecommendRequest request) {
        var vehicle = vehicleService.getById(request.vehicleId());
        return ResponseEntity.ok(recommendationService.recommend(vehicle));
    }
}
