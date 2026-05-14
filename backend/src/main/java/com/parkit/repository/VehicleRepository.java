package com.parkit.repository;

import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.Vehicle;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VehicleRepository extends JpaRepository<Vehicle, String> {

    List<Vehicle> findByOwner(NormalUser owner);

    @Query("SELECT v FROM Vehicle v WHERE v.owner.userID = :ownerId")
    List<Vehicle> findByOwnerId(@Param("ownerId") String ownerId);
}
