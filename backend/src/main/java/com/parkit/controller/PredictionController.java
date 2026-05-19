package com.parkit.controller;

import com.parkit.dto.PredictionResponse;
import com.parkit.service.PredictionService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @PostMapping("/{floorId}/generate")
    public ResponseEntity<List<PredictionResponse>> generate(@PathVariable String floorId) {
        return ResponseEntity.ok(predictionService.generatePredictions(floorId).stream()
                .map(PredictionResponse::from).toList());
    }

    @GetMapping("/{floorId}")
    public ResponseEntity<List<PredictionResponse>> get(@PathVariable String floorId) {
        return ResponseEntity.ok(predictionService.getPredictions(floorId).stream()
                .map(PredictionResponse::from).toList());
    }

    @GetMapping("/lot/{lotId}")
    public ResponseEntity<List<PredictionResponse>> getByLot(@PathVariable String lotId) {
        return ResponseEntity.ok(predictionService.getPredictionsByLot(lotId).stream()
                .map(PredictionResponse::from).toList());
    }
}
