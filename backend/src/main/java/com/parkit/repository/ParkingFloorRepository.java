package com.parkit.repository;

import com.parkit.domain.model.ParkingFloor;
import com.parkit.domain.model.ParkingLot;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ParkingFloorRepository extends JpaRepository<ParkingFloor, String> {

    List<ParkingFloor> findByLot(ParkingLot lot);

    @Query("SELECT f FROM ParkingFloor f WHERE f.lot.lotID = :lotId")
    List<ParkingFloor> findByLotId(@Param("lotId") String lotId);
}
