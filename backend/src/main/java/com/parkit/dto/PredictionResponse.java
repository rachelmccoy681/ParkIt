package com.parkit.dto;

import com.parkit.domain.model.AvailabilityPrediction;
import java.time.Instant;

public record PredictionResponse(
        String predictionId,
        String floorId,
        Instant timeSlot,
        double predictedAvailability
) {
    public static PredictionResponse from(AvailabilityPrediction prediction) {
        return new PredictionResponse(
                prediction.getPredictionID(),
                prediction.getFloorID(),
                prediction.getTimeSlot(),
                prediction.getPredictedAvailability()
        );
    }
}
