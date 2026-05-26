package com.parkit.service;

import com.parkit.domain.model.Booking;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.repository.ParkingSpotRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SensorSimulationService {

    private static final int MIN_OCCUPIED_MINUTES = 3;
    private static final int MAX_OCCUPIED_MINUTES = 10;
    private static final int MAX_SIMULATED_AT_ONCE = 3;

    private final ParkingSpotRepository spotRepository;
    private final ParkingSpotService spotService;
    private final Random random = new Random();

    // spotId -> time when simulation should release it back to AVAILABLE
    private final ConcurrentHashMap<String, Instant> simulatedSpots = new ConcurrentHashMap<>();

    public SensorSimulationService(ParkingSpotRepository spotRepository,
                                    ParkingSpotService spotService) {
        this.spotRepository = spotRepository;
        this.spotService = spotService;
    }

    @Scheduled(fixedDelay = 45_000)
    @Transactional
    public void tick() {
        Instant now = Instant.now();

        // Release spots whose simulated occupancy window has ended
        Iterator<Map.Entry<String, Instant>> it = simulatedSpots.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Instant> entry = it.next();
            if (now.isAfter(entry.getValue())) {
                spotService.updateStatus(entry.getKey(), ParkingSpot.SpotStatusEnum.AVAILABLE);
                it.remove();
            }
        }

        // Pick new spots to simulate if we have room
        int slots = MAX_SIMULATED_AT_ONCE - simulatedSpots.size();
        if (slots <= 0) return;

        List<ParkingSpot> candidates = spotRepository.findAvailableWithNoActiveBooking(
                List.of(Booking.BookingStatusEnum.CANCELLED, Booking.BookingStatusEnum.EXPIRED));

        // Shuffle by swapping into a small random selection
        for (int i = 0; i < Math.min(slots, candidates.size()); i++) {
            int pick = i + random.nextInt(candidates.size() - i);
            ParkingSpot chosen = candidates.get(pick);
            candidates.set(pick, candidates.get(i));
            candidates.set(i, chosen);

            int minutes = MIN_OCCUPIED_MINUTES + random.nextInt(MAX_OCCUPIED_MINUTES - MIN_OCCUPIED_MINUTES + 1);
            Instant release = now.plus(minutes, ChronoUnit.MINUTES);
            simulatedSpots.put(chosen.getSpotID(), release);
            spotService.updateStatus(chosen.getSpotID(), ParkingSpot.SpotStatusEnum.OCCUPIED);
        }
    }
}
