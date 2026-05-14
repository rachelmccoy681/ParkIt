package com.parkit.dto;

import com.parkit.domain.model.Vehicle;

public record VehicleResponse(
        String vehicleId,
        String plateNumber,
        String make,
        String model,
        String vehicleType,
        boolean isDisabled
) {
    public static VehicleResponse from(Vehicle vehicle) {
        return new VehicleResponse(
                vehicle.getVehicleID(),
                vehicle.getPlateNumber(),
                vehicle.getMake(),
                vehicle.getModel(),
                vehicle.getVehicleType().name(),
                vehicle.isDisabled()
        );
    }
}
