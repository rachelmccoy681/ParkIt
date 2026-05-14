package com.parkit.domain.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("STANDARD")
public class StandardSpot extends ParkingSpot {

	protected StandardSpot() {
	}

	public StandardSpot(ParkingFloor floor, double hourlyRate) {
		super(floor, hourlyRate);
	}

	@Override
	public SpotTypeEnum getSpotType() {
		return SpotTypeEnum.STANDARD;
	}

	@Override
	public boolean isBookableBy(Vehicle vehicle) {
		return vehicle.canUseSpotType(SpotTypeEnum.STANDARD);
	}
}
