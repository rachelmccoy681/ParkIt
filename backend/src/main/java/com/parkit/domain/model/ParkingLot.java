package com.parkit.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "parking_lots")
public class ParkingLot {

	@Id
	@Column(name = "lot_id", length = 36, nullable = false, updatable = false)
	private String lotID;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String address;

	@OneToMany(mappedBy = "lot", cascade = CascadeType.ALL, orphanRemoval = true)
	private final List<ParkingFloor> floors = new ArrayList<>();

	protected ParkingLot() {
	}

	public ParkingLot(String name, String address) {
		this.name = Objects.requireNonNull(name);
		this.address = Objects.requireNonNull(address);
	}

	@PrePersist
	protected void assignId() {
		if (lotID == null) {
			lotID = UUID.randomUUID().toString();
		}
	}

	public void addFloor(ParkingFloor floor) {
		Objects.requireNonNull(floor);
		floors.add(floor);
		floor.setLot(this);
	}

	public int getTotalCapacity() {
		return floors.stream().mapToInt(ParkingFloor::getCapacity).sum();
	}

	public int getTotalAvailable() {
		return floors.stream().mapToInt(f -> (int) f.getSpots().stream().filter(ParkingSpot::isAvailable).count()).sum();
	}

	public int getTotalOccupied() {
		return floors.stream().mapToInt(ParkingFloor::getOccupiedCount).sum();
	}

	public List<ParkingFloor> getFloors() {
		return Collections.unmodifiableList(floors);
	}

	public String getLotID() {
		return lotID;
	}

	public String getName() {
		return name;
	}

	public String getAddress() {
		return address;
	}
}
