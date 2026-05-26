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
@Table(name = "availability_predictions")
public class AvailabilityPrediction {

	@Id
	@Column(name = "prediction_id", length = 36, nullable = false, updatable = false)
	private String predictionID;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "floor_id", nullable = false)
	private ParkingFloor floor;

	@Column(name = "predicted_availability", nullable = false)
	private double predictedAvailability;

	@Column(name = "time_slot", nullable = false)
	private Instant timeSlot;

	@Column(name = "generated_at", nullable = false)
	private Instant generatedAt;

	protected AvailabilityPrediction() {
	}

	public AvailabilityPrediction(ParkingFloor floor, Instant timeSlot) {
		this.floor = Objects.requireNonNull(floor);
		this.timeSlot = Objects.requireNonNull(timeSlot);
		this.generatedAt = Instant.now();
	}

	@PrePersist
	protected void assignId() {
		if (predictionID == null) {
			predictionID = UUID.randomUUID().toString();
		}
		if (generatedAt == null) {
			generatedAt = Instant.now();
		}
	}

	public String getPredictionID() {
		return predictionID;
	}

	public String getFloorID() {
		return floor != null ? floor.getFloorID() : null;
	}

	public double getPredictedAvailability() {
		return predictedAvailability;
	}

	public void setPredictedAvailability(double predictedAvailability) {
		this.predictedAvailability = predictedAvailability;
	}

	public Instant getTimeSlot() {
		return timeSlot;
	}

	public Instant getGeneratedAt() {
		return generatedAt;
	}

	public ParkingFloor getFloor() {
		return floor;
	}
}
