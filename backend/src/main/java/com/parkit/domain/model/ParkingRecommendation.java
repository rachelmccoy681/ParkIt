package com.parkit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "parking_recommendations")
public class ParkingRecommendation {

	@Id
	@Column(name = "recommendation_id", length = 36, nullable = false, updatable = false)
	private String recommendationID;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "vehicle_id")
	private Vehicle vehicle;

	@Column(name = "requested_at", nullable = false)
	private Instant requestedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "suggested_floor_id")
	private ParkingFloor suggestedFloor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "suggested_spot_id")
	private ParkingSpot suggestedSpot;

	@Column(length = 2000)
	private String reason;

	@Column(name = "generated_at", nullable = false)
	private Instant generatedAt;

	protected ParkingRecommendation() {
	}

	public ParkingRecommendation(Vehicle vehicle, Instant datetime) {
		this.vehicle = Objects.requireNonNull(vehicle);
		this.requestedAt = Objects.requireNonNull(datetime);
		this.generatedAt = Instant.now();
	}

	@PrePersist
	protected void assignId() {
		if (recommendationID == null) {
			recommendationID = UUID.randomUUID().toString();
		}
		if (generatedAt == null) {
			generatedAt = Instant.now();
		}
	}

	public ParkingFloor getLeastCongestedFloor() {
		return suggestedFloor;
	}

	public ParkingSpot getBestAvailableSpot(Vehicle vehicle) {
		Objects.requireNonNull(vehicle);
		return suggestedSpot;
	}

	public void setSuggestion(ParkingFloor floor, ParkingSpot spot, String reason) {
		this.suggestedFloor = floor;
		this.suggestedSpot = spot;
		this.reason = reason;
	}

	public String getRecommendationID() {
		return recommendationID;
	}

	public Vehicle getVehicle() {
		return vehicle;
	}

	public Instant getRequestedAt() {
		return requestedAt;
	}

	public ParkingFloor getSuggestedFloor() {
		return suggestedFloor;
	}

	public ParkingSpot getSuggestedSpot() {
		return suggestedSpot;
	}

	public String getReason() {
		return reason;
	}

	public Instant getGeneratedAt() {
		return generatedAt;
	}
}
