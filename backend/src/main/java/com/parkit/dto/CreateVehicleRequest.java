package com.parkit.dto;

import com.parkit.domain.model.Vehicle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateVehicleRequest(
        @NotBlank String plateNumber,
        @NotBlank String make,
        @NotBlank String model,
        @NotNull Vehicle.VehicleTypeEnum vehicleType,
        boolean isDisabled
) {}
