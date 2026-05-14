package com.parkit.dto;

import com.parkit.domain.model.ParkingRecommendation;

public record RecommendationResponse(
        String recommendationId,
        String vehicleId,
        String suggestedFloorId,
        String suggestedSpotId,
        String reason
) {
    public static RecommendationResponse from(ParkingRecommendation rec) {
        return new RecommendationResponse(
                rec.getRecommendationID(),
                rec.getVehicle().getVehicleID(),
                rec.getSuggestedFloor().getFloorID(),
                rec.getSuggestedSpot().getSpotID(),
                rec.getReason()
        );
    }
}
