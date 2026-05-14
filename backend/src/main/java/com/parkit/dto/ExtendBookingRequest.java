package com.parkit.dto;

import jakarta.validation.constraints.Min;

public record ExtendBookingRequest(@Min(1) int additionalMinutes) {}
