package com.parkit.service;

import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.Vehicle;
import com.parkit.dto.CreateVehicleRequest;
import com.parkit.dto.VehicleResponse;
import com.parkit.repository.NormalUserRepository;
import com.parkit.repository.VehicleRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final NormalUserRepository normalUserRepository;

    public VehicleService(VehicleRepository vehicleRepository,
                          NormalUserRepository normalUserRepository) {
        this.vehicleRepository = vehicleRepository;
        this.normalUserRepository = normalUserRepository;
    }

    public VehicleResponse addVehicle(String userId, CreateVehicleRequest request) {
        NormalUser user = findNormalUser(userId);
        Vehicle vehicle = new Vehicle(
                request.plateNumber(), request.make(), request.model(),
                request.vehicleType(), request.isDisabled()
        );
        user.addVehicle(vehicle);
        vehicleRepository.save(vehicle);
        return VehicleResponse.from(vehicle);
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getMyVehicles(String userId) {
        return vehicleRepository.findByOwnerId(userId).stream()
                .map(VehicleResponse::from)
                .toList();
    }

    public void removeVehicle(String userId, String vehicleId) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));
        if (!vehicle.getOwner().getUserID().equals(userId)) {
            throw new SecurityException("Access denied");
        }
        vehicleRepository.delete(vehicle);
    }

    private NormalUser findNormalUser(String userId) {
        return normalUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Driver account not found"));
    }
}
