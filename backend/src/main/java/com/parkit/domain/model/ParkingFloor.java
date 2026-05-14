package com.parkit.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "parking_floors")
public class ParkingFloor {

	@Id
	@Column(name = "floor_id", length = 36, nullable = false, updatable = false)
	private String floorID;

	@Column(name = "floor_label", nullable = false)
	private String floorLabel;

	@Column(nullable = false)
	private int capacity;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "lot_id", nullable = false)
	private ParkingLot lot;

	@OneToMany(mappedBy = "floor", cascade = CascadeType.ALL, orphanRemoval = true)
	private final List<ParkingSpot> spots = new ArrayList<>();

	protected ParkingFloor() {
	}

	public ParkingFloor(String floorLabel, int capacity) {
		this.floorLabel = Objects.requireNonNull(floorLabel);
		if (capacity <= 0) {
			throw new IllegalArgumentException("capacity must be positive");
		}
		this.capacity = capacity;
	}

	@PrePersist
	protected void assignId() {
		if (floorID == null) {
			floorID = UUID.randomUUID().toString();
		}
	}

	public void addSpot(ParkingSpot spot) {
		Objects.requireNonNull(spot);
		spots.add(spot);
		spot.setFloor(this);
	}

	public List<ParkingSpot> getAvailableSpots() {
		return spots.stream().filter(ParkingSpot::isAvailable).toList();
	}

	public int getOccupiedCount() {
		return (int) spots.stream().filter(s -> s.getStatus() == ParkingSpot.SpotStatusEnum.OCCUPIED).count();
	}

	public double getOccupancyRate() {
		if (capacity == 0) {
			return 0.0;
		}
		return (double) getOccupiedCount() / (double) capacity;
	}

	public List<ParkingSpot> getSpots() {
		return Collections.unmodifiableList(spots);
	}

	public String getFloorID() {
		return floorID;
	}

	public String getFloorLabel() {
		return floorLabel;
	}

	public int getCapacity() {
		return capacity;
	}

	public ParkingLot getLot() {
		return lot;
	}

	void setLot(ParkingLot lot) {
		this.lot = lot;
	}
}
