package com.parkit.controller;

import com.parkit.dto.ParkingFloorResponse;
import com.parkit.dto.ParkingLotResponse;
import com.parkit.service.ParkingLotService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/lots")
public class ParkingLotController {

    private final ParkingLotService lotService;

    public ParkingLotController(ParkingLotService lotService) {
        this.lotService = lotService;
    }

    @GetMapping
    public ResponseEntity<List<ParkingLotResponse>> getAll() {
        return ResponseEntity.ok(lotService.getAllLots().stream()
                .map(ParkingLotResponse::from).toList());
    }

    @GetMapping("/{lotId}")
    public ResponseEntity<ParkingLotResponse> getById(@PathVariable String lotId) {
        return ResponseEntity.ok(ParkingLotResponse.from(lotService.getLotById(lotId)));
    }

    @GetMapping("/{lotId}/floors")
    public ResponseEntity<List<ParkingFloorResponse>> getFloors(@PathVariable String lotId) {
        return ResponseEntity.ok(lotService.getFloorsByLot(lotId).stream()
                .map(ParkingFloorResponse::from).toList());
    }
}
