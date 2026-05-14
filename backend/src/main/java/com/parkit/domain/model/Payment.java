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
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "payments")
public class Payment {

	public enum PaymentStatusEnum { PENDING, COMPLETED, REFUNDED, FAILED }

	@Id
	@Column(name = "payment_id", length = 36, nullable = false, updatable = false)
	private String paymentID;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "booking_id", nullable = false, unique = true)
	private Booking booking;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private NormalUser user;

	@Column(nullable = false)
	private double amount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private PaymentStatusEnum status = PaymentStatusEnum.PENDING;

	@Column(nullable = false)
	private Instant timestamp;

	protected Payment() {
	}

	public Payment(Booking booking, NormalUser user, double amount) {
		this.booking = Objects.requireNonNull(booking);
		this.user = Objects.requireNonNull(user);
		if (amount <= 0) {
			throw new IllegalArgumentException("amount must be greater than zero");
		}
		this.amount = amount;
		this.timestamp = Instant.now();
	}

	@PrePersist
	protected void assignId() {
		if (paymentID == null) {
			paymentID = UUID.randomUUID().toString();
		}
		if (timestamp == null) {
			timestamp = Instant.now();
		}
	}

	public void addAmount(double extra) {
		if (extra <= 0) throw new IllegalArgumentException("extra must be positive");
		this.amount += extra;
	}

	public boolean processPayment() {
		if (status != PaymentStatusEnum.PENDING) {
			return false;
		}
		status = PaymentStatusEnum.COMPLETED;
		return true;
	}

	public boolean refundPayment() {
		if (status != PaymentStatusEnum.COMPLETED) {
			return false;
		}
		status = PaymentStatusEnum.REFUNDED;
		return true;
	}

	public PaymentStatusEnum getStatus() {
		return status;
	}

	public String getPaymentID() {
		return paymentID;
	}

	public String getBookingID() {
		return booking != null ? booking.getBookingID() : null;
	}

	public String getUserID() {
		return user != null ? user.getUserID() : null;
	}

	public double getAmount() {
		return amount;
	}

	public Instant getTimestamp() {
		return timestamp;
	}

	public Booking getBooking() {
		return booking;
	}
}
