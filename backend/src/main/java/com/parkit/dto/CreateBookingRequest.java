package com.parkit.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateBookingRequest(
        @NotBlank String spotId,
        @NotBlank String vehicleId,
        @NotNull Instant startTime,
        @Min(1) int durationMinutes
) {}
