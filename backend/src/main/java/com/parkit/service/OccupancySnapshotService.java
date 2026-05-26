package com.parkit.service;

import com.parkit.domain.model.OccupancySnapshot;
import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.repository.OccupancySnapshotRepository;
import com.parkit.repository.ParkingFloorRepository;
import com.parkit.repository.ParkingSpotRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OccupancySnapshotService {

    private final OccupancySnapshotRepository snapshotRepository;
    private final ParkingFloorRepository floorRepository;
    private final ParkingSpotRepository spotRepository;

    public OccupancySnapshotService(OccupancySnapshotRepository snapshotRepository,
                                     ParkingFloorRepository floorRepository,
                                     ParkingSpotRepository spotRepository) {
        this.snapshotRepository = snapshotRepository;
        this.floorRepository = floorRepository;
        this.spotRepository = spotRepository;
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void captureSnapshot() {
        Instant now = Instant.now().truncatedTo(ChronoUnit.HOURS);
        ZonedDateTime zdt = now.atZone(ZoneOffset.UTC);
        DayOfWeek dow = zdt.getDayOfWeek();
        int hour = zdt.getHour();

        for (ParkingFloor floor : floorRepository.findAll()) {
            List<ParkingSpot> spots = spotRepository.findByFloorId(floor.getFloorID());
            int occupied = (int) spots.stream()
                    .filter(s -> s.getStatus() == ParkingSpot.SpotStatusEnum.OCCUPIED).count();
            int reserved = (int) spots.stream()
                    .filter(s -> s.getStatus() == ParkingSpot.SpotStatusEnum.RESERVED).count();
            int available = spots.size() - occupied - reserved;
            snapshotRepository.save(new OccupancySnapshot(
                    floor, occupied, reserved, available, floor.getCapacity(), dow, hour, now));
        }
    }
}
