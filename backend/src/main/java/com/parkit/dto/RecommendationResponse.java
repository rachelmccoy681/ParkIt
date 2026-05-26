package com.parkit.dto;

public record RecommendationResponse(
        String recommendationId,
        String vehicleId,
        String suggestedFloorId,
        String suggestedSpotId,
        String reason
) {
}
