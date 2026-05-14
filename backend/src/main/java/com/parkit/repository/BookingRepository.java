package com.parkit.repository;

import com.parkit.domain.model.Booking;
import com.parkit.domain.model.NormalUser;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, String> {

    List<Booking> findByUser(NormalUser user);

    List<Booking> findByUserAndStatus(NormalUser user, Booking.BookingStatusEnum status);

    List<Booking> findByStatus(Booking.BookingStatusEnum status);

    // Finds confirmed bookings whose start time has passed the expiry cutoff (startTime + 5 min).
    // Caller computes: cutoff = Instant.now().minus(5, ChronoUnit.MINUTES)
    @Query("SELECT b FROM Booking b WHERE b.status = :status AND b.startTime < :cutoff")
    List<Booking> findByStatusAndStartTimeBefore(@Param("status") Booking.BookingStatusEnum status,
                                                  @Param("cutoff") Instant cutoff);

    // Used by predictive availability — fetches bookings on a floor within a historical time window.
    @Query("""
            SELECT b FROM Booking b
            WHERE b.spot.floor.floorID = :floorId
              AND b.startTime >= :from
              AND b.startTime < :to
              AND b.status IN :statuses
            """)
    List<Booking> findByFloorAndTimeRange(@Param("floorId") String floorId,
                                          @Param("from") Instant from,
                                          @Param("to") Instant to,
                                          @Param("statuses") Collection<Booking.BookingStatusEnum> statuses);
}
