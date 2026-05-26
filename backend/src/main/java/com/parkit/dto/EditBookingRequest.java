package com.parkit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import java.time.Instant;

public record EditBookingRequest(
        @NotBlank String spotId,
        @NotBlank String vehicleId,
        Instant startTime,
        @Positive int durationMinutes
) {}
