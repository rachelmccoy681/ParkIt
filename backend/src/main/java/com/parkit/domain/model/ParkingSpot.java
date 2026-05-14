package com.parkit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "parking_spots")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "spot_kind")
public abstract class ParkingSpot {

	public enum SpotTypeEnum { STANDARD, EV, DISABLED }
	public enum SpotStatusEnum { AVAILABLE, OCCUPIED, RESERVED }

	@Id
	@Column(name = "spot_id", length = 36, nullable = false, updatable = false)
	private String spotID;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private SpotStatusEnum status = SpotStatusEnum.AVAILABLE;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "floor_id", nullable = false)
	private ParkingFloor floor;

	@Column(name = "hourly_rate", nullable = false)
	private double hourlyRate;

	protected ParkingSpot() {
	}

	protected ParkingSpot(ParkingFloor floor, double hourlyRate) {
		this.floor = Objects.requireNonNull(floor);
		if (hourlyRate < 0) {
			throw new IllegalArgumentException("hourlyRate must be non-negative");
		}
		this.hourlyRate = hourlyRate;
	}

	@PrePersist
	protected void assignId() {
		if (spotID == null) {
			spotID = UUID.randomUUID().toString();
		}
	}

	public abstract SpotTypeEnum getSpotType();

	public abstract boolean isBookableBy(Vehicle vehicle);

	public void updateStatus(SpotStatusEnum status) {
		this.status = Objects.requireNonNull(status);
	}

	public boolean isAvailable() {
		return status == SpotStatusEnum.AVAILABLE;
	}

	public double getHourlyRate() {
		return hourlyRate;
	}

	public SpotStatusEnum getStatus() {
		return status;
	}

	public String getSpotID() {
		return spotID;
	}

	public String getFloorID() {
		return floor != null ? floor.getFloorID() : null;
	}

	public ParkingFloor getFloor() {
		return floor;
	}

	void setFloor(ParkingFloor floor) {
		this.floor = floor; }

	public void setHourlyRate(double hourlyRate) {
		if (hourlyRate < 0) {
			throw new IllegalArgumentException("hourlyRate must be non-negative");
		}
		this.hourlyRate = hourlyRate;
	}
}
