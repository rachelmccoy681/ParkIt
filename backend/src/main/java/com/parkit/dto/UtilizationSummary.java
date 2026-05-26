package com.parkit.dto;

import java.util.List;

public record UtilizationSummary(
        String floorId,
        String floorLabel,
        double avgUtilizationRate,
        int peakHour,
        String peakDayOfWeek,
        List<DayBreakdown> dayOfWeekBreakdown
) {}
