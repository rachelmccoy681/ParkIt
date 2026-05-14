package com.parkit.domain.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Entity
@DiscriminatorValue("NORMAL")
public class NormalUser extends User {

	@OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
	private final List<Vehicle> vehicles = new ArrayList<>();

	protected NormalUser() {
	}

	public NormalUser(String email, String password, String username) {
		super(email, password, username);
	}

	public void addVehicle(Vehicle vehicle) {
		Objects.requireNonNull(vehicle);
		vehicles.add(vehicle);
		vehicle.setOwner(this);
	}

	public void removeVehicle(String vehicleID) {
		vehicles.removeIf(v -> v.getVehicleID().equals(vehicleID));
	}

	public List<Vehicle> getVehicles() {
		return Collections.unmodifiableList(vehicles);
	}
}
