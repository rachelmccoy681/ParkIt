package com.parkit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record AdminCreateBookingRequest(
        @NotBlank String userId,
        @NotBlank String spotId,
        @NotBlank String vehicleId,
        Instant startTime,
        @Positive int durationMinutes
) {}
