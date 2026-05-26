package com.parkit.domain.strategy;

import org.springframework.stereotype.Component;

public class HolidayPricingStrategy implements PricingStrategy {

    @Override
    public double calculateCost(double hourlyRate, double durationHours) {
        return hourlyRate * durationHours * 1.5;
    }
}
