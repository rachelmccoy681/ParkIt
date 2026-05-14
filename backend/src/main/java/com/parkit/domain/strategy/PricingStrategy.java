package com.parkit.domain.strategy;

public interface PricingStrategy {
    double calculateCost(double hourlyRate, double durationHours);
}
