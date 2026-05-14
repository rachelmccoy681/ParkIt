package com.parkit.domain.factory;

import com.parkit.domain.model.DisabledSpot;
import com.parkit.domain.model.EvSpot;
import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.domain.model.StandardSpot;
import java.util.Objects;

public final class ParkingSpotFactory {

	private ParkingSpotFactory() {
	}

	public static ParkingSpot createSpot(ParkingSpot.SpotTypeEnum type, ParkingFloor floor, double hourlyRate) {
		Objects.requireNonNull(type);
		Objects.requireNonNull(floor);
		return switch (type) {
			case STANDARD -> new StandardSpot(floor, hourlyRate);
			case EV -> new EvSpot(floor, hourlyRate);
			case DISABLED -> new DisabledSpot(floor, hourlyRate);
		};
	}
}
