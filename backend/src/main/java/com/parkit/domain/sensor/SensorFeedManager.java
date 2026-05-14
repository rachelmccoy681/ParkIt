package com.parkit.domain.sensor;

import com.parkit.dto.SpotStatusMessage;
import java.time.Instant;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

public final class SensorFeedManager {

	private static volatile SensorFeedManager instance;

	private Instant lastUpdated;
	private boolean isRunning;
	private final CopyOnWriteArrayList<Consumer<SpotStatusMessage>> spotUpdateListeners = new CopyOnWriteArrayList<>();

	private SensorFeedManager() {
	}

	public static SensorFeedManager getInstance() {
		if (instance == null) {
			synchronized (SensorFeedManager.class) {
				if (instance == null) {
					instance = new SensorFeedManager();
				}
			}
		}
		return instance;
	}

	public void registerSpotUpdateListener(Consumer<SpotStatusMessage> listener) {
		spotUpdateListeners.add(Objects.requireNonNull(listener));
	}

	public void startFeed() {
		isRunning = true;
	}

	public void stopFeed() {
		isRunning = false;
	}

	public void simulateStateTransition() {
		lastUpdated = Instant.now();
	}

	public void updateSpotStatus(String spotId, String floorId, String status) {
		Objects.requireNonNull(spotId);
		Objects.requireNonNull(floorId);
		Objects.requireNonNull(status);
		lastUpdated = Instant.now();
		broadcastUpdate(new SpotStatusMessage(spotId, floorId, status, lastUpdated));
	}

	public void broadcastUpdate(SpotStatusMessage event) {
		for (Consumer<SpotStatusMessage> listener : spotUpdateListeners) {
			listener.accept(event);
		}
	}

	public Instant getLastUpdated() { return lastUpdated; }

	public boolean isRunning() {
		return isRunning;
	}
}
