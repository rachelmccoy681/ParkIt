package com.parkit.controller;

import com.parkit.dto.CreateVehicleRequest;
import com.parkit.dto.VehicleResponse;
import com.parkit.service.VehicleService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<VehicleResponse> addVehicle(@Valid @RequestBody CreateVehicleRequest request,
                                                       Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vehicleService.addVehicle(authentication.getName(), request));
    }

    @GetMapping("/my")
    public ResponseEntity<List<VehicleResponse>> getMyVehicles(Authentication authentication) {
        return ResponseEntity.ok(vehicleService.getMyVehicles(authentication.getName()));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VehicleResponse>> getUserVehicles(@PathVariable String userId) {
        return ResponseEntity.ok(vehicleService.getUserVehicles(userId));
    }

    @DeleteMapping("/{vehicleId}")
    public ResponseEntity<Void> removeVehicle(@PathVariable String vehicleId,
                                               Authentication authentication) {
        vehicleService.removeVehicle(authentication.getName(), vehicleId);
        return ResponseEntity.noContent().build();
    }
}
