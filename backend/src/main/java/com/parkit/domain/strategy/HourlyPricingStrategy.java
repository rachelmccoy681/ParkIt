package com.parkit.domain.strategy;

import org.springframework.stereotype.Component;

@Component
public class HourlyPricingStrategy implements PricingStrategy {

    @Override
    public double calculateCost(double hourlyRate, double durationHours) {
        return hourlyRate * durationHours;
    }
}
