package com.parkit.service;

import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingLot;
import com.parkit.repository.ParkingFloorRepository;
import com.parkit.repository.ParkingLotRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ParkingLotService {

    private final ParkingLotRepository lotRepository;
    private final ParkingFloorRepository floorRepository;

    public ParkingLotService(ParkingLotRepository lotRepository,
                              ParkingFloorRepository floorRepository) {
        this.lotRepository = lotRepository;
        this.floorRepository = floorRepository;
    }

    public List<ParkingLot> getAllLots() {
        return lotRepository.findAll();
    }

    public ParkingLot getLotById(String lotId) {
        return lotRepository.findById(lotId)
                .orElseThrow(() -> new IllegalArgumentException("Lot not found"));
    }

    public List<ParkingFloor> getFloorsByLot(String lotId) {
        return floorRepository.findByLotId(lotId);
    }
}
