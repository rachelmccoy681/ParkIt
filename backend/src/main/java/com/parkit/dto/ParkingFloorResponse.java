package com.parkit.dto;

import com.parkit.domain.model.ParkingFloor;

public record ParkingFloorResponse(
        String floorId,
        String floorLabel,
        int capacity,
        double occupancyRate
) {
    public static ParkingFloorResponse from(ParkingFloor floor) {
        return new ParkingFloorResponse(
                floor.getFloorID(),
                floor.getFloorLabel(),
                floor.getCapacity(),
                floor.getOccupancyRate()
        );
    }
}
