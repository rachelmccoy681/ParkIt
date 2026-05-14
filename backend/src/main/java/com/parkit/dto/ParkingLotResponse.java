package com.parkit.dto;

import com.parkit.domain.model.ParkingLot;

public record ParkingLotResponse(String lotId, String name, String address) {

    public static ParkingLotResponse from(ParkingLot lot) {
        return new ParkingLotResponse(lot.getLotID(), lot.getName(), lot.getAddress());
    }
}
