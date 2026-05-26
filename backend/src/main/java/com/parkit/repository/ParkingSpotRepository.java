package com.parkit.repository;

import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingSpot;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParkingSpotRepository extends JpaRepository<ParkingSpot, String> {

    List<ParkingSpot> findByFloor(ParkingFloor floor);

    @Query("SELECT s FROM ParkingSpot s WHERE s.floor.floorID = :floorId")
    List<ParkingSpot> findByFloorId(@Param("floorId") String floorId);

    @Query("SELECT s FROM ParkingSpot s WHERE s.floor.floorID = :floorId AND s.status = :status")
    List<ParkingSpot> findByFloorIdAndStatus(@Param("floorId") String floorId,
                                              @Param("status") ParkingSpot.SpotStatusEnum status);

    List<ParkingSpot> findByStatus(ParkingSpot.SpotStatusEnum status);

    // Spots that are AVAILABLE and have no non-cancelled/expired bookings — safe to simulate.
    @Query("""
            SELECT s FROM ParkingSpot s
            WHERE s.status = 'AVAILABLE'
              AND NOT EXISTS (
                SELECT b FROM Booking b
                WHERE b.spot = s
                  AND b.status NOT IN :excluded
              )
            """)
    List<ParkingSpot> findAvailableWithNoActiveBooking(
            @Param("excluded") java.util.Collection<com.parkit.domain.model.Booking.BookingStatusEnum> excluded);

    // All spots on a floor that have no overlapping active booking in the given window.
    @Query("""
            SELECT s FROM ParkingSpot s
            WHERE s.floor.floorID = :floorId
              AND NOT EXISTS (
                SELECT b FROM Booking b
                WHERE b.spot = s
                  AND b.status NOT IN :excluded
                  AND b.startTime < :endTime
                  AND b.endTime > :startTime
              )
            """)
    List<ParkingSpot> findBookableByFloor(
            @Param("floorId") String floorId,
            @Param("startTime") java.time.Instant startTime,
            @Param("endTime") java.time.Instant endTime,
            @Param("excluded") java.util.Collection<com.parkit.domain.model.Booking.BookingStatusEnum> excluded);
}
