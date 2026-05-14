package com.parkit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "vehicles")
public class Vehicle {

	public enum VehicleTypeEnum { GAS, EV, HYBRID }

	@Id
	@Column(name = "vehicle_id", length = 36, nullable = false, updatable = false)
	private String vehicleID;

	@Column(name = "plate_number", nullable = false)
	private String plateNumber;

	@Column(nullable = false)
	private String make;

	@Column(nullable = false)
	private String model;

	@Enumerated(EnumType.STRING)
	@Column(name = "vehicle_type", nullable = false)
	private VehicleTypeEnum vehicleType;

	@Column(name = "is_disabled", nullable = false)
	private boolean isDisabled;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "owner_id", nullable = false)
	private NormalUser owner;

	protected Vehicle() {
	}

	public Vehicle(String plateNumber, String make, String model, VehicleTypeEnum vehicleType, boolean isDisabled) {
		this.plateNumber = Objects.requireNonNull(plateNumber);
		this.make = Objects.requireNonNull(make);
		this.model = Objects.requireNonNull(model);
		this.vehicleType = Objects.requireNonNull(vehicleType);
		this.isDisabled = isDisabled;
	}

	@PrePersist
	protected void assignId() {
		if (vehicleID == null) {
			vehicleID = UUID.randomUUID().toString();
		}
	}

	public List<ParkingSpot.SpotTypeEnum> getEligibleSpotTypes() {
		if (isDisabled) {
			return List.of(ParkingSpot.SpotTypeEnum.STANDARD, ParkingSpot.SpotTypeEnum.EV, ParkingSpot.SpotTypeEnum.DISABLED);
		}
		List<ParkingSpot.SpotTypeEnum> types = new ArrayList<>();
		types.add(ParkingSpot.SpotTypeEnum.STANDARD);
		if (vehicleType == VehicleTypeEnum.EV || vehicleType == VehicleTypeEnum.HYBRID) {
			types.add(ParkingSpot.SpotTypeEnum.EV);
		}
		return List.copyOf(types);
	}

	public String getPlateNumber() {
		return plateNumber;
	}

	public boolean isDisabledVehicle() {
		return isDisabled;
	}

	public String getVehicleID() {
		return vehicleID;
	}

	public String getMake() {
		return make;
	}

	public String getModel() {
		return model;
	}

	public VehicleTypeEnum getVehicleType() {
		return vehicleType;
	}

	public boolean isDisabled() {
		return isDisabled;
	}

	public NormalUser getOwner() {
		return owner;
	}

	void setOwner(NormalUser owner) {
		this.owner = owner;
	}

	public boolean canUseSpotType(ParkingSpot.SpotTypeEnum spotType) {
		return getEligibleSpotTypes().contains(spotType);
	}
}
