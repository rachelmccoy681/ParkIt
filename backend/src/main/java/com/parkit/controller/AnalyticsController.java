package com.parkit.controller;

import com.parkit.dto.PeakHourPoint;
import com.parkit.dto.UtilizationSummary;
import com.parkit.service.AnalyticsService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/peak-hours")
    public ResponseEntity<List<PeakHourPoint>> peakHours(
            @RequestParam String floorId,
            @RequestParam(defaultValue = "365") int days) {
        return ResponseEntity.ok(analyticsService.getPeakHours(floorId, days));
    }

    @GetMapping("/utilization")
    public ResponseEntity<UtilizationSummary> utilization(
            @RequestParam String floorId,
            @RequestParam(defaultValue = "365") int days) {
        return ResponseEntity.ok(analyticsService.getUtilizationStats(floorId, days));
    }
}
