package com.parkit.domain.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("EV")
public class EvSpot extends ParkingSpot {

	protected EvSpot() {
	}

	public EvSpot(ParkingFloor floor, double hourlyRate) {
		super(floor, hourlyRate);
	}

	@Override
	public SpotTypeEnum getSpotType() {
		return SpotTypeEnum.EV;
	}

	@Override
	public boolean isBookableBy(Vehicle vehicle) {
		return vehicle.canUseSpotType(SpotTypeEnum.EV);
	}
}
