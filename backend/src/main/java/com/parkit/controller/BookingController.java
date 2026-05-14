package com.parkit.controller;

import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.domain.model.Vehicle;
import com.parkit.dto.BookingResponse;
import com.parkit.dto.CreateBookingRequest;
import com.parkit.dto.ExtendBookingRequest;
import com.parkit.repository.VehicleRepository;
import com.parkit.service.BookingService;
import com.parkit.service.ParkingSpotService;
import com.parkit.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final UserService userService;
    private final ParkingSpotService spotService;
    private final VehicleRepository vehicleRepository;

    public BookingController(BookingService bookingService,
                              UserService userService,
                              ParkingSpotService spotService,
                              VehicleRepository vehicleRepository) {
        this.bookingService = bookingService;
        this.userService = userService;
        this.spotService = spotService;
        this.vehicleRepository = vehicleRepository;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request,
                                                   Authentication authentication) {
        String userId = authentication.getName();
        if (!(userService.findById(userId) instanceof NormalUser user)) {
            throw new IllegalArgumentException("User is not a driver account");
        }
        ParkingSpot spot = spotService.getById(request.spotId());
        Vehicle vehicle = vehicleRepository.findById(request.vehicleId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

        var booking = bookingService.createBooking(user, spot, vehicle, request.startTime(), request.durationMinutes());
        return ResponseEntity.status(HttpStatus.CREATED).body(BookingResponse.from(booking));
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable String bookingId) {
        bookingService.cancelBooking(bookingId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{bookingId}/extend")
    public ResponseEntity<Void> extend(@PathVariable String bookingId,
                                        @Valid @RequestBody ExtendBookingRequest request) {
        bookingService.extendBooking(bookingId, request.additionalMinutes());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingResponse>> getUserBookings(@PathVariable String userId,
                                                                  Authentication authentication) {
        requireSelfOrAdmin(userId, authentication);
        if (!(userService.findById(userId) instanceof NormalUser user)) {
            throw new IllegalArgumentException("User is not a driver account");
        }
        return ResponseEntity.ok(bookingService.getUserBookings(user).stream()
                .map(BookingResponse::from).toList());
    }

    @GetMapping("/user/{userId}/active")
    public ResponseEntity<List<BookingResponse>> getUserActiveBookings(@PathVariable String userId,
                                                                        Authentication authentication) {
        requireSelfOrAdmin(userId, authentication);
        if (!(userService.findById(userId) instanceof NormalUser user)) {
            throw new IllegalArgumentException("User is not a driver account");
        }
        return ResponseEntity.ok(bookingService.getUserActiveBookings(user).stream()
                .map(BookingResponse::from).toList());
    }

    private void requireSelfOrAdmin(String userId, Authentication authentication) {
        boolean isSelf = authentication.getName().equals(userId);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isSelf && !isAdmin) {
            throw new SecurityException("Access denied");
        }
    }
}
