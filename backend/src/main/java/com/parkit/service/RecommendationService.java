package com.parkit.service;

import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingRecommendation;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.domain.model.Vehicle;
import com.parkit.repository.ParkingFloorRepository;
import com.parkit.repository.ParkingSpotRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RecommendationService {

    private final ParkingFloorRepository floorRepository;
    private final ParkingSpotRepository spotRepository;

    public RecommendationService(ParkingFloorRepository floorRepository,
                                  ParkingSpotRepository spotRepository) {
        this.floorRepository = floorRepository;
        this.spotRepository = spotRepository;
    }

    public ParkingRecommendation recommend(Vehicle vehicle) {
        List<ParkingFloor> floors = floorRepository.findAll();

        ParkingFloor bestFloor = floors.stream()
                .filter(f -> hasCompatibleAvailableSpot(f, vehicle))
                .min(Comparator.comparingDouble(ParkingFloor::getOccupancyRate))
                .orElseThrow(() -> new IllegalStateException("No available spots for this vehicle type"));

        ParkingSpot bestSpot = spotRepository
                .findByFloorIdAndStatus(bestFloor.getFloorID(), ParkingSpot.SpotStatusEnum.AVAILABLE)
                .stream()
                .filter(s -> s.isBookableBy(vehicle))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No compatible spot found"));

        ParkingRecommendation recommendation = new ParkingRecommendation(vehicle, Instant.now());
        recommendation.setSuggestion(bestFloor, bestSpot,
                "Least congested floor with an available " + bestSpot.getSpotType() + " spot.");

        return recommendation;
    }

    private boolean hasCompatibleAvailableSpot(ParkingFloor floor, Vehicle vehicle) {
        return floor.getSpots().stream()
                .anyMatch(s -> s.isAvailable() && s.isBookableBy(vehicle));
    }
}
