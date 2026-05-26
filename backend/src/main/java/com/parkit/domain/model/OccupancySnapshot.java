package com.parkit.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.DayOfWeek;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "occupancy_snapshots")
public class OccupancySnapshot {

    @Id
    @Column(name = "snapshot_id", length = 36, nullable = false, updatable = false)
    private String snapshotId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "floor_id", nullable = false)
    private ParkingFloor floor;

    @Column(name = "occupied_count", nullable = false)
    private int occupiedCount;

    @Column(name = "reserved_count", nullable = false)
    private int reservedCount;

    @Column(name = "available_count", nullable = false)
    private int availableCount;

    @Column(nullable = false)
    private int capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false)
    private DayOfWeek dayOfWeek;

    @Column(name = "hour_of_day", nullable = false)
    private int hourOfDay;

    @Column(name = "captured_at", nullable = false)
    private Instant capturedAt;

    protected OccupancySnapshot() {
    }

    public OccupancySnapshot(ParkingFloor floor, int occupiedCount, int reservedCount,
                              int availableCount, int capacity, DayOfWeek dayOfWeek,
                              int hourOfDay, Instant capturedAt) {
        this.floor = Objects.requireNonNull(floor);
        this.occupiedCount = occupiedCount;
        this.reservedCount = reservedCount;
        this.availableCount = availableCount;
        this.capacity = capacity;
        this.dayOfWeek = Objects.requireNonNull(dayOfWeek);
        this.hourOfDay = hourOfDay;
        this.capturedAt = Objects.requireNonNull(capturedAt);
    }

    @PrePersist
    protected void assignId() {
        if (snapshotId == null) {
            snapshotId = UUID.randomUUID().toString();
        }
    }

    public String getSnapshotId() { return snapshotId; }
    public ParkingFloor getFloor() { return floor; }
    public int getOccupiedCount() { return occupiedCount; }
    public int getReservedCount() { return reservedCount; }
    public int getAvailableCount() { return availableCount; }
    public int getCapacity() { return capacity; }
    public DayOfWeek getDayOfWeek() { return dayOfWeek; }
    public int getHourOfDay() { return hourOfDay; }
    public Instant getCapturedAt() { return capturedAt; }
}
