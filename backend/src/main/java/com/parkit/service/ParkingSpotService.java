package com.parkit.service;

import com.parkit.domain.model.ParkingSpot;
import com.parkit.domain.sensor.SensorFeedManager;
import com.parkit.repository.ParkingSpotRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ParkingSpotService {

    private final ParkingSpotRepository spotRepository;

    public ParkingSpotService(ParkingSpotRepository spotRepository) {
        this.spotRepository = spotRepository;
    }

    @Transactional(readOnly = true)
    public List<ParkingSpot> getByFloor(String floorId) {
        return spotRepository.findByFloorId(floorId);
    }

    @Transactional(readOnly = true)
    public List<ParkingSpot> getAvailableByFloor(String floorId) {
        return spotRepository.findByFloorIdAndStatus(floorId, ParkingSpot.SpotStatusEnum.AVAILABLE);
    }

    @Transactional(readOnly = true)
    public ParkingSpot getById(String spotId) {
        return spotRepository.findById(spotId)
                .orElseThrow(() -> new IllegalArgumentException("Spot not found"));
    }

    public void updateStatus(String spotId, ParkingSpot.SpotStatusEnum status) {
        ParkingSpot spot = spotRepository.findById(spotId)
                .orElseThrow(() -> new IllegalArgumentException("Spot not found"));
        spot.updateStatus(status);
        spotRepository.save(spot);
        SensorFeedManager.getInstance().updateSpotStatus(spotId, spot.getFloorID(), status.name());
    }
}
