package com.parkit.dto;

import com.parkit.domain.model.ParkingSpot;
import jakarta.validation.constraints.NotNull;

public record UpdateSpotStatusRequest(@NotNull ParkingSpot.SpotStatusEnum status) {}
