package com.parkit.repository;

import com.parkit.domain.model.OccupancySnapshot;
import java.time.DayOfWeek;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OccupancySnapshotRepository extends JpaRepository<OccupancySnapshot, String> {

    @Query("""
            SELECT o FROM OccupancySnapshot o
            WHERE o.floor.floorID = :floorId
              AND o.dayOfWeek = :dayOfWeek
              AND o.hourOfDay = :hourOfDay
              AND o.capturedAt >= :from
            """)
    List<OccupancySnapshot> findRecent(@Param("floorId") String floorId,
                                       @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                       @Param("hourOfDay") int hourOfDay,
                                       @Param("from") Instant from);

    @Query("""
            SELECT o FROM OccupancySnapshot o
            WHERE o.floor.floorID = :floorId
              AND o.dayOfWeek = :dayOfWeek
              AND o.hourOfDay = :hourOfDay
              AND o.capturedAt BETWEEN :from AND :to
            """)
    List<OccupancySnapshot> findHistorical(@Param("floorId") String floorId,
                                            @Param("dayOfWeek") DayOfWeek dayOfWeek,
                                            @Param("hourOfDay") int hourOfDay,
                                            @Param("from") Instant from,
                                            @Param("to") Instant to);

    @Query("SELECT o FROM OccupancySnapshot o WHERE o.floor.floorID = :floorId")
    List<OccupancySnapshot> findAllByFloorId(@Param("floorId") String floorId);

    @Query("SELECT o FROM OccupancySnapshot o WHERE o.floor.floorID = :floorId AND o.capturedAt >= :from")
    List<OccupancySnapshot> findByFloorIdFrom(@Param("floorId") String floorId, @Param("from") Instant from);
}
