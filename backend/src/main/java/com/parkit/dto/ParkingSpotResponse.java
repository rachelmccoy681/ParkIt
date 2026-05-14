package com.parkit.dto;

import com.parkit.domain.model.ParkingSpot;

public record ParkingSpotResponse(
        String spotId,
        String floorId,
        String spotType,
        String status,
        double hourlyRate
) {
    public static ParkingSpotResponse from(ParkingSpot spot) {
        return new ParkingSpotResponse(
                spot.getSpotID(),
                spot.getFloorID(),
                spot.getSpotType().name(),
                spot.getStatus().name(),
                spot.getHourlyRate()
        );
    }
}
