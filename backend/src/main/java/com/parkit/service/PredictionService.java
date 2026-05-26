package com.parkit.service;

import com.parkit.domain.model.AvailabilityPrediction;
import com.parkit.domain.model.OccupancySnapshot;
import com.parkit.domain.model.ParkingFloor;
import com.parkit.repository.AvailabilityPredictionRepository;
import com.parkit.repository.OccupancySnapshotRepository;
import com.parkit.repository.ParkingFloorRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.OptionalDouble;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PredictionService {

    private final AvailabilityPredictionRepository predictionRepository;
    private final OccupancySnapshotRepository snapshotRepository;
    private final ParkingFloorRepository floorRepository;

    public PredictionService(AvailabilityPredictionRepository predictionRepository,
                              OccupancySnapshotRepository snapshotRepository,
                              ParkingFloorRepository floorRepository) {
        this.predictionRepository = predictionRepository;
        this.snapshotRepository = snapshotRepository;
        this.floorRepository = floorRepository;
    }

    // Generates 24-hour availability predictions for a floor.
    // Recent bucket: last 4 weeks, matching day-of-week + hour.
    // Historical bucket: same ±4-week window one year ago, matching day-of-week + hour.
    // Weighted 60% recent / 40% historical; falls back to whichever bucket has data.
    public List<AvailabilityPrediction> generatePredictions(String floorId) {
        ParkingFloor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));

        predictionRepository.deleteByFloorId(floorId);

        Instant now = Instant.now();
        Instant recentFrom = now.minus(28, ChronoUnit.DAYS);
        Instant historicalFrom = now.minus(365 + 28, ChronoUnit.DAYS);
        Instant historicalTo = now.minus(365 - 28, ChronoUnit.DAYS);

        List<AvailabilityPrediction> predictions = new ArrayList<>();
        Instant base = now.truncatedTo(ChronoUnit.HOURS);

        for (int i = 0; i < 24; i++) {
            Instant slotStart = base.plus(i, ChronoUnit.HOURS);
            ZonedDateTime slotZdt = slotStart.atZone(ZoneOffset.UTC);
            DayOfWeek dow = slotZdt.getDayOfWeek();
            int hour = slotZdt.getHour();

            List<OccupancySnapshot> recent =
                    snapshotRepository.findRecent(floorId, dow, hour, recentFrom);
            List<OccupancySnapshot> historical =
                    snapshotRepository.findHistorical(floorId, dow, hour, historicalFrom, historicalTo);

            double avgOccupancy = weightedOccupancy(recent, historical);

            AvailabilityPrediction prediction = new AvailabilityPrediction(floor, slotStart);
            prediction.setPredictedAvailability(1.0 - avgOccupancy);
            predictions.add(predictionRepository.save(prediction));
        }

        return predictions;
    }

    @Transactional(readOnly = true)
    public List<AvailabilityPrediction> getPredictions(String floorId) {
        return predictionRepository.findByFloorIdFrom(floorId, Instant.now().truncatedTo(ChronoUnit.HOURS));
    }

    @Transactional(readOnly = true)
    public List<AvailabilityPrediction> getPredictionsByLot(String lotId) {
        return predictionRepository.findByLotIdFrom(lotId, Instant.now().truncatedTo(ChronoUnit.HOURS));
    }

    @Scheduled(cron = "0 0 0 * * *")
    public void scheduledRegeneration() {
        floorRepository.findAll().forEach(f -> generatePredictions(f.getFloorID()));
    }

    private double weightedOccupancy(List<OccupancySnapshot> recent, List<OccupancySnapshot> historical) {
        OptionalDouble recentAvg = recent.stream()
                .mapToDouble(s -> (double) (s.getOccupiedCount() + s.getReservedCount()) / s.getCapacity())
                .average();
        OptionalDouble historicalAvg = historical.stream()
                .mapToDouble(s -> (double) (s.getOccupiedCount() + s.getReservedCount()) / s.getCapacity())
                .average();

        if (recentAvg.isPresent() && historicalAvg.isPresent()) {
            return Math.min(1.0, 0.6 * recentAvg.getAsDouble() + 0.4 * historicalAvg.getAsDouble());
        } else if (recentAvg.isPresent()) {
            return Math.min(1.0, recentAvg.getAsDouble());
        } else if (historicalAvg.isPresent()) {
            return Math.min(1.0, historicalAvg.getAsDouble());
        }
        return 0.0;
    }
}
