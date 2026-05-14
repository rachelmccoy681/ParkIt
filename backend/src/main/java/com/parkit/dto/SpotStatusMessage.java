package com.parkit.dto;

import java.time.Instant;

public record SpotStatusMessage(String spotId, String floorId, String status, Instant timestamp) {}
