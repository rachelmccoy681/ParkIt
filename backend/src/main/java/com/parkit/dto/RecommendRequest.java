package com.parkit.dto;

import jakarta.validation.constraints.NotBlank;

public record RecommendRequest(@NotBlank String vehicleId) {}
