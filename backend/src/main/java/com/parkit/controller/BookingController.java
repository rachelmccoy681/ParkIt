package com.parkit.controller;

import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.domain.model.Vehicle;
import com.parkit.dto.AdminCreateBookingRequest;
import com.parkit.dto.BookingResponse;
import com.parkit.dto.CreateBookingRequest;
import com.parkit.dto.EditBookingRequest;
import com.parkit.dto.ExtendBookingRequest;
import com.parkit.service.BookingService;
import com.parkit.service.ParkingSpotService;
import com.parkit.service.UserService;
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
    private final VehicleService vehicleService;

    public BookingController(BookingService bookingService,
                              UserService userService,
                              ParkingSpotService spotService,
                              VehicleService vehicleService) {
        this.bookingService = bookingService;
        this.userService = userService;
        this.spotService = spotService;
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> create(@Valid @RequestBody CreateBookingRequest request,
                                                   Authentication authentication) {
        String userId = authentication.getName();
        if (!(userService.findById(userId) instanceof NormalUser user)) {
            throw new IllegalArgumentException("User is not a driver account");
        }
        ParkingSpot spot = spotService.getById(request.spotId());
        Vehicle vehicle = vehicleService.getById(request.vehicleId());

        var booking = bookingService.createBooking(user, spot, vehicle, request.startTime(), request.durationMinutes());
        return ResponseEntity.status(HttpStatus.CREATED).body(BookingResponse.from(booking));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings().stream()
                .map(BookingResponse::from).toList());
    }

    @PostMapping("/admin/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> adminCreate(@Valid @RequestBody AdminCreateBookingRequest request) {
        if (!(userService.findById(request.userId()) instanceof NormalUser user)) {
            throw new IllegalArgumentException("Target user is not a driver account");
        }
        ParkingSpot spot = spotService.getById(request.spotId());
        Vehicle vehicle = vehicleService.getById(request.vehicleId());

        var booking = bookingService.createBooking(user, spot, vehicle, request.startTime(), request.durationMinutes());
        return ResponseEntity.status(HttpStatus.CREATED).body(BookingResponse.from(booking));
    }

    @GetMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> getById(@PathVariable String bookingId,
                                                    Authentication authentication) {
        var booking = bookingService.getBookingById(bookingId);
        requireSelfOrAdmin(booking.getUserID(), authentication);
        return ResponseEntity.ok(BookingResponse.from(booking));
    }

    @PutMapping("/{bookingId}")
    public ResponseEntity<BookingResponse> edit(@PathVariable String bookingId,
                                                 @Valid @RequestBody EditBookingRequest request,
                                                 Authentication authentication) {
        var existing = bookingService.getBookingById(bookingId);
        requireSelfOrAdmin(existing.getUserID(), authentication);

        ParkingSpot spot = spotService.getById(request.spotId());
        Vehicle vehicle = vehicleService.getById(request.vehicleId());

        var updated = bookingService.editBooking(bookingId, spot, vehicle, request.startTime(), request.durationMinutes());
        return ResponseEntity.ok(BookingResponse.from(updated));
    }

    @DeleteMapping("/{bookingId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String bookingId) {
        bookingService.deleteBooking(bookingId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<Void> cancel(@PathVariable String bookingId, Authentication authentication) {
        var booking = bookingService.getBookingById(bookingId);
        requireSelfOrAdmin(booking.getUserID(), authentication);
        bookingService.cancelBooking(bookingId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{bookingId}/extend")
    public ResponseEntity<Void> extend(@PathVariable String bookingId,
                                        @Valid @RequestBody ExtendBookingRequest request,
                                        Authentication authentication) {
        var booking = bookingService.getBookingById(bookingId);
        requireSelfOrAdmin(booking.getUserID(), authentication);
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
