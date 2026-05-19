package com.parkit.dto;

import com.parkit.domain.model.Booking;
import java.time.Instant;

public record BookingResponse(
        String bookingId,
        String userId,
        String spotId,
        String vehicleId,
        Instant startTime,
        Instant endTime,
        int duration,
        double totalAmount,
        String status,
        String floorLabel,
        String spotType
) {
    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getBookingID(),
                booking.getUserID(),
                booking.getSpotID(),
                booking.getVehicleID(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getDuration(),
                booking.getTotalAmount(),
                booking.getStatus().name(),
                booking.getSpot().getFloor().getFloorLabel(),
                booking.getSpot().getSpotType().name()
        );
    }
}
