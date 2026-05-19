package com.parkit.service;

import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.domain.model.Vehicle;
import com.parkit.dto.RecommendationResponse;
import com.parkit.repository.ParkingFloorRepository;
import com.parkit.repository.ParkingSpotRepository;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
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

    public RecommendationResponse recommend(Vehicle vehicle) {
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

        return new RecommendationResponse(
                UUID.randomUUID().toString(),
                vehicle.getVehicleID(),
                bestFloor.getFloorID(),
                bestSpot.getSpotID(),
                "Least congested floor with an available " + bestSpot.getSpotType() + " spot."
        );
    }

    private boolean hasCompatibleAvailableSpot(ParkingFloor floor, Vehicle vehicle) {
        return floor.getSpots().stream()
                .anyMatch(s -> s.isAvailable() && s.isBookableBy(vehicle));
    }
}
