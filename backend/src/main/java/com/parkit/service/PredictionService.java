package com.parkit.service;

import com.parkit.domain.model.AvailabilityPrediction;
import com.parkit.domain.model.Booking;
import com.parkit.domain.model.ParkingFloor;
import com.parkit.repository.AvailabilityPredictionRepository;
import com.parkit.repository.BookingRepository;
import com.parkit.repository.ParkingFloorRepository;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PredictionService {

    private final AvailabilityPredictionRepository predictionRepository;
    private final BookingRepository bookingRepository;
    private final ParkingFloorRepository floorRepository;

    public PredictionService(AvailabilityPredictionRepository predictionRepository,
                              BookingRepository bookingRepository,
                              ParkingFloorRepository floorRepository) {
        this.predictionRepository = predictionRepository;
        this.bookingRepository = bookingRepository;
        this.floorRepository = floorRepository;
    }

    // Generates 24-hour availability predictions for a floor based on 4 weeks of booking history.
    public List<AvailabilityPrediction> generatePredictions(String floorId) {
        ParkingFloor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));

        predictionRepository.deleteByFloorId(floorId);

        Instant historicalStart = Instant.now().minus(28, ChronoUnit.DAYS);
        List<Booking> history = bookingRepository.findByFloorAndTimeRange(
                floorId, historicalStart, Instant.now(),
                List.of(Booking.BookingStatusEnum.CONFIRMED,
                        Booking.BookingStatusEnum.EXTENDED,
                        Booking.BookingStatusEnum.EXPIRED));

        int capacity = floor.getCapacity();
        List<AvailabilityPrediction> predictions = new ArrayList<>();
        Instant base = Instant.now().truncatedTo(ChronoUnit.HOURS);

        for (int i = 0; i < 24; i++) {
            Instant slotStart = base.plus(i, ChronoUnit.HOURS);
            int slotHour = slotStart.atZone(ZoneOffset.UTC).getHour();

            long bookingsAtThisHour = history.stream()
                    .filter(b -> b.getStartTime().atZone(ZoneOffset.UTC).getHour() == slotHour)
                    .count();

            // Average over 4 weeks (4 occurrences of each hour)
            double avgOccupancy = capacity > 0 ? Math.min(1.0, bookingsAtThisHour / (4.0 * capacity)) : 0.0;

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
}
