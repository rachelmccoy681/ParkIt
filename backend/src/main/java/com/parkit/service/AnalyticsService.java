package com.parkit.service;

import com.parkit.domain.model.OccupancySnapshot;
import com.parkit.domain.model.ParkingFloor;
import com.parkit.dto.DayBreakdown;
import com.parkit.dto.PeakHourPoint;
import com.parkit.dto.UtilizationSummary;
import com.parkit.repository.OccupancySnapshotRepository;
import com.parkit.repository.ParkingFloorRepository;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.Comparator;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final OccupancySnapshotRepository snapshotRepository;
    private final ParkingFloorRepository floorRepository;

    public AnalyticsService(OccupancySnapshotRepository snapshotRepository,
                             ParkingFloorRepository floorRepository) {
        this.snapshotRepository = snapshotRepository;
        this.floorRepository = floorRepository;
    }

    public List<PeakHourPoint> getPeakHours(String floorId, int days) {
        List<OccupancySnapshot> snapshots = snapshots(floorId, days);
        Map<Integer, DoubleSummaryStatistics> byHour = snapshots.stream()
                .collect(Collectors.groupingBy(
                        OccupancySnapshot::getHourOfDay,
                        Collectors.summarizingDouble(this::occupancyRate)));
        return IntStream.range(0, 24)
                .mapToObj(h -> new PeakHourPoint(h,
                        byHour.containsKey(h) ? byHour.get(h).getAverage() : 0.0))
                .toList();
    }

    public UtilizationSummary getUtilizationStats(String floorId, int days) {
        ParkingFloor floor = floorRepository.findById(floorId)
                .orElseThrow(() -> new IllegalArgumentException("Floor not found"));
        List<OccupancySnapshot> snapshots = snapshots(floorId, days);

        if (snapshots.isEmpty()) {
            return new UtilizationSummary(floorId, floor.getFloorLabel(), 0.0, 0, "N/A", List.of());
        }

        double avgUtil = snapshots.stream()
                .mapToDouble(this::occupancyRate)
                .average().orElse(0.0);

        Map<Integer, DoubleSummaryStatistics> byHour = snapshots.stream()
                .collect(Collectors.groupingBy(OccupancySnapshot::getHourOfDay,
                        Collectors.summarizingDouble(this::occupancyRate)));
        int peakHour = byHour.entrySet().stream()
                .max(Comparator.comparingDouble(e -> e.getValue().getAverage()))
                .map(Map.Entry::getKey).orElse(0);

        Map<DayOfWeek, DoubleSummaryStatistics> byDay = snapshots.stream()
                .collect(Collectors.groupingBy(OccupancySnapshot::getDayOfWeek,
                        Collectors.summarizingDouble(this::occupancyRate)));
        String peakDay = byDay.entrySet().stream()
                .max(Comparator.comparingDouble(e -> e.getValue().getAverage()))
                .map(e -> e.getKey().toString()).orElse("N/A");

        List<DayBreakdown> breakdown = Arrays.stream(DayOfWeek.values())
                .map(dow -> new DayBreakdown(
                        dow.toString(),
                        byDay.containsKey(dow) ? byDay.get(dow).getAverage() : 0.0))
                .toList();

        return new UtilizationSummary(floorId, floor.getFloorLabel(), avgUtil, peakHour, peakDay, breakdown);
    }

    private List<OccupancySnapshot> snapshots(String floorId, int days) {
        if (days <= 0) return snapshotRepository.findAllByFloorId(floorId);
        return snapshotRepository.findByFloorIdFrom(floorId, Instant.now().minus(days, ChronoUnit.DAYS));
    }

    private double occupancyRate(OccupancySnapshot s) {
        return (double) (s.getOccupiedCount() + s.getReservedCount()) / s.getCapacity();
    }
}
