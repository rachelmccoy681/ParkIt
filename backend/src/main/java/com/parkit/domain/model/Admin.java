package com.parkit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.util.Objects;

@Entity
@DiscriminatorValue("ADMIN")
public class Admin extends User {

	@Column(name = "admin_id", length = 36)
	private String adminID;

	protected Admin() {
	}

	public Admin(String email, String password, String username) {
		super(email, password, username);
	}

	@PrePersist
	@PreUpdate
	private void ensureAdminId() {
		if (adminID == null) {
			adminID = getUserID();
		}
	}

	public void suspendUser(String userID) {
		Objects.requireNonNull(userID);
	}

	public void reactivateUser(String userID) {
		Objects.requireNonNull(userID);
	}

	public void manageBooking(String bookingID) {
		Objects.requireNonNull(bookingID);
	}

	public void viewDashboard() {
	}

	public void updateParkingRate(ParkingSpot.SpotTypeEnum spotType, double rate) {
		Objects.requireNonNull(spotType);
		if (rate < 0) {
			throw new IllegalArgumentException("rate must be non-negative");
		}
	}

	public String getAdminID() {
		return adminID;
	}
}
