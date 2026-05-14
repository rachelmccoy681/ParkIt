package com.parkit.domain.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("DISABLED")
public class DisabledSpot extends ParkingSpot {

	protected DisabledSpot() {
	}

	public DisabledSpot(ParkingFloor floor, double hourlyRate) {
		super(floor, hourlyRate);
	}

	@Override
	public SpotTypeEnum getSpotType() {
		return SpotTypeEnum.DISABLED;
	}

	@Override
	public boolean isBookableBy(Vehicle vehicle) {
		return vehicle.canUseSpotType(SpotTypeEnum.DISABLED);
	}
}
