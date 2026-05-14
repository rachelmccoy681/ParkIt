package com.parkit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "users")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "user_kind")
public abstract class User {

	@Id
	@Column(name = "user_id", length = 36, nullable = false, updatable = false)
	private String userID;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String password;

	@Column(nullable = false, unique = true)
	private String username;

	@Column(name = "registered_date", nullable = false)
	private Instant registeredDate;

	@Column(name = "is_active", nullable = false)
	private boolean isActive = true;

	@Column(name = "is_email_verified", nullable = false, columnDefinition = "boolean default false")
	private boolean isEmailVerified = false;

	@Column(name = "verification_code")
	private String verificationCode;

	@Column(name = "verification_code_expiry")
	private Instant verificationCodeExpiry;

	@Column(name = "reset_code")
	private String resetCode;

	@Column(name = "reset_code_expiry")
	private Instant resetCodeExpiry;

	protected User() {
	}

	protected User(String email, String password, String username) {
		this.email = Objects.requireNonNull(email);
		this.password = Objects.requireNonNull(password);
		this.username = Objects.requireNonNull(username);
		this.registeredDate = Instant.now();
	}

	@PrePersist
	protected void assignId() {
		if (userID == null) {
			userID = UUID.randomUUID().toString();
		}
		if (registeredDate == null) {
			registeredDate = Instant.now();
		}
	}

	public void login() {
	}

	public void logout() {
	}

	public void resetPassword(String newEncodedPassword) {
		this.password = Objects.requireNonNull(newEncodedPassword);
	}

	public String getUserID() {
		return userID;
	}

	public String getEmail() {
		return email;
	}

	public String getUsername() {
		return username;
	}

	public String getPassword() {
		return password;
	}

	public Instant getRegisteredDate() {
		return registeredDate;
	}

	public boolean isActive() {
		return isActive;
	}

	public void setActive(boolean active) {
		isActive = active;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public boolean isEmailVerified() {
		return isEmailVerified;
	}

	public void setEmailVerified(boolean emailVerified) {
		isEmailVerified = emailVerified;
	}

	public String getVerificationCode() {
		return verificationCode;
	}

	public void setVerificationCode(String verificationCode) {
		this.verificationCode = verificationCode;
	}

	public Instant getVerificationCodeExpiry() {
		return verificationCodeExpiry;
	}

	public void setVerificationCodeExpiry(Instant verificationCodeExpiry) {
		this.verificationCodeExpiry = verificationCodeExpiry;
	}

	public String getResetCode() {
		return resetCode;
	}

	public void setResetCode(String resetCode) {
		this.resetCode = resetCode;
	}

	public Instant getResetCodeExpiry() {
		return resetCodeExpiry;
	}

	public void setResetCodeExpiry(Instant resetCodeExpiry) {
		this.resetCodeExpiry = resetCodeExpiry;
	}
}
