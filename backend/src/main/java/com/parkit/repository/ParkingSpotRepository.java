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
}
