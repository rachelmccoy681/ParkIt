package com.parkit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "bookings")
public class Booking {

	public enum BookingStatusEnum { PENDING, CONFIRMED, CANCELLED, EXPIRED, EXTENDED }

	@Id
	@Column(name = "booking_id", length = 36, nullable = false, updatable = false)
	private String bookingID;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private NormalUser user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "spot_id", nullable = false)
	private ParkingSpot spot;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "vehicle_id", nullable = false)
	private Vehicle vehicle;

	@Column(name = "start_time", nullable = false)
	private Instant startTime;

	@Column(name = "end_time", nullable = false)
	private Instant endTime;

	@Column(nullable = false)
	private int duration;

	@Column(name = "total_amount", nullable = false)
	private double totalAmount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private BookingStatusEnum status = BookingStatusEnum.PENDING;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@OneToOne(mappedBy = "booking", fetch = FetchType.LAZY)
	private Payment payment;

	protected Booking() {
	}

	public Booking(NormalUser user, ParkingSpot spot, Vehicle vehicle, Instant startTime, int durationMinutes) {
		this.user = Objects.requireNonNull(user);
		this.spot = Objects.requireNonNull(spot);
		this.vehicle = Objects.requireNonNull(vehicle);
		this.startTime = Objects.requireNonNull(startTime);
		if (durationMinutes <= 0) {
			throw new IllegalArgumentException("duration must be positive");
		}
		this.duration = durationMinutes;
		this.endTime = startTime.plus(durationMinutes, ChronoUnit.MINUTES);
		this.createdAt = Instant.now();
	}

	@PrePersist
	protected void assignId() {
		if (bookingID == null) {
			bookingID = UUID.randomUUID().toString();
		}
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public double calculateCost() {
		if (totalAmount > 0) {
			return totalAmount;
		}
		double hours = duration / 60.0;
		return spot.getHourlyRate() * hours;
	}

	public void cancelBooking() {
		this.status = BookingStatusEnum.CANCELLED;
	}

	public void extendBooking(int additionalDurationMinutes) {
		if (additionalDurationMinutes <= 0) {
			throw new IllegalArgumentException("additionalDurationMinutes must be positive");
		}
		this.duration += additionalDurationMinutes;
		this.endTime = this.endTime.plus(additionalDurationMinutes, ChronoUnit.MINUTES);
		this.status = BookingStatusEnum.EXTENDED;
	}

	public boolean isExpired() {
		return status == BookingStatusEnum.EXPIRED;
	}

	public void applyEdit(ParkingSpot newSpot, Vehicle newVehicle, Instant newStartTime, int newDurationMinutes) {
		if (newDurationMinutes <= 0) throw new IllegalArgumentException("duration must be positive");
		this.spot = Objects.requireNonNull(newSpot);
		this.vehicle = Objects.requireNonNull(newVehicle);
		this.startTime = Objects.requireNonNull(newStartTime);
		this.duration = newDurationMinutes;
		this.endTime = newStartTime.plus(newDurationMinutes, ChronoUnit.MINUTES);
		this.status = BookingStatusEnum.CONFIRMED;
	}

	public void setTotalAmount(double totalAmount) {
		this.totalAmount = totalAmount;
	}

	public void setStatus(BookingStatusEnum status) {
		this.status = Objects.requireNonNull(status);
	}

	public String getBookingID() {
		return bookingID;
	}

	public String getUserID() {
		return user != null ? user.getUserID() : null;
	}

	public String getSpotID() {
		return spot != null ? spot.getSpotID() : null;
	}

	public String getVehicleID() {
		return vehicle != null ? vehicle.getVehicleID() : null;
	}

	public Instant getStartTime() {
		return startTime;
	}

	public Instant getEndTime() {
		return endTime;
	}

	public int getDuration() {
		return duration;
	}

	public double getTotalAmount() {
		return totalAmount;
	}

	public BookingStatusEnum getStatus() {
		return status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public NormalUser getUser() {
		return user;
	}

	public ParkingSpot getSpot() {
		return spot;
	}

	public Vehicle getVehicle() {
		return vehicle;
	}

	public Payment getPayment() {
		return payment;
	}

	public void attachPayment(Payment payment) {
		this.payment = Objects.requireNonNull(payment);
	}
}
