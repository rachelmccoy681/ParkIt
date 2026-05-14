package com.parkit.repository;

import com.parkit.domain.model.AvailabilityPrediction;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvailabilityPredictionRepository extends JpaRepository<AvailabilityPrediction, String> {

    @Query("SELECT p FROM AvailabilityPrediction p WHERE p.floor.floorID = :floorId ORDER BY p.timeSlot ASC")
    List<AvailabilityPrediction> findByFloorId(@Param("floorId") String floorId);

    @Query("SELECT p FROM AvailabilityPrediction p WHERE p.floor.floorID = :floorId AND p.timeSlot >= :from ORDER BY p.timeSlot ASC")
    List<AvailabilityPrediction> findByFloorIdFrom(@Param("floorId") String floorId, @Param("from") Instant from);

    @Modifying
    @Query("DELETE FROM AvailabilityPrediction p WHERE p.floor.floorID = :floorId")
    void deleteByFloorId(@Param("floorId") String floorId);
}
