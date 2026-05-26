package com.parkit.service;

import com.parkit.domain.model.Booking;
import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.ParkingSpot;
import com.parkit.domain.model.Vehicle;
import com.parkit.domain.strategy.PricingStrategy;
import com.parkit.repository.BookingRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ParkingSpotService spotService;
    private final PaymentService paymentService;
    private final PricingStrategy pricingStrategy;

    public BookingService(BookingRepository bookingRepository,
                          ParkingSpotService spotService,
                          PaymentService paymentService,
                          PricingStrategy pricingStrategy) {
        this.bookingRepository = bookingRepository;
        this.spotService = spotService;
        this.paymentService = paymentService;
        this.pricingStrategy = pricingStrategy;
    }

    public Booking createBooking(NormalUser user, ParkingSpot spot, Vehicle vehicle,
                                  Instant startTime, int durationMinutes) {
        Instant now = Instant.now();
        if (startTime.isBefore(now.minus(2, ChronoUnit.MINUTES))) {
            throw new IllegalStateException("Start time cannot be in the past");
        }
        if (startTime.isAfter(now.plus(7, ChronoUnit.DAYS))) {
            throw new IllegalStateException("Cannot book more than 7 days in advance");
        }

        boolean startsWithinThirtyMin = startTime.isBefore(now.plus(30, ChronoUnit.MINUTES));
        if (startsWithinThirtyMin && !spot.isAvailable()) {
            throw new IllegalStateException("Spot is not currently available");
        }
        if (!spot.isBookableBy(vehicle)) {
            throw new IllegalStateException("Vehicle is not eligible for this spot type");
        }

        Instant endTime = startTime.plus(durationMinutes, ChronoUnit.MINUTES);
        long conflicts = bookingRepository.countOverlappingBookings(
                spot.getSpotID(), startTime, endTime,
                List.of(Booking.BookingStatusEnum.CANCELLED, Booking.BookingStatusEnum.EXPIRED));
        if (conflicts > 0) {
            throw new IllegalStateException("Spot is already booked for this time period");
        }

        double cost = pricingStrategy.calculateCost(spot.getHourlyRate(), durationMinutes / 60.0);
        Booking booking = new Booking(user, spot, vehicle, startTime, durationMinutes);
        booking.setTotalAmount(cost);
        booking.setStatus(Booking.BookingStatusEnum.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        paymentService.processPayment(saved, user, cost);
        if (startsWithinThirtyMin) {
            spotService.updateStatus(spot.getSpotID(), ParkingSpot.SpotStatusEnum.RESERVED);
        }

        return saved;
    }

    public Booking checkIn(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        if (booking.getStatus() != Booking.BookingStatusEnum.CONFIRMED
                && booking.getStatus() != Booking.BookingStatusEnum.EXTENDED) {
            throw new IllegalStateException("Booking is not active");
        }
        spotService.updateStatus(booking.getSpotID(), ParkingSpot.SpotStatusEnum.OCCUPIED);
        return booking;
    }

    public void cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        booking.cancelBooking();
        bookingRepository.save(booking);

        paymentService.refundPayment(bookingId);
        // Only free the spot if the booking had been reserved on it (starts within 30 min or already started).
        // Future bookings never touched the live spot status, so don't clear it.
        boolean wasReserved = booking.getStartTime().isBefore(Instant.now().plus(30, ChronoUnit.MINUTES));
        if (wasReserved) {
            spotService.updateStatus(booking.getSpotID(), ParkingSpot.SpotStatusEnum.AVAILABLE);
        }
    }

    public void extendBooking(String bookingId, int additionalMinutes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        Instant currentEnd = booking.getEndTime();
        Instant newEnd = currentEnd.plus(additionalMinutes, ChronoUnit.MINUTES);

        long conflicts = bookingRepository.countOverlappingBookings(
                booking.getSpotID(),
                currentEnd,
                newEnd,
                List.of(Booking.BookingStatusEnum.CANCELLED, Booking.BookingStatusEnum.EXPIRED));
        if (conflicts > 0) {
            throw new IllegalStateException(
                    "Cannot extend — another booking starts before " + newEnd + " on this spot");
        }

        double additionalHours = additionalMinutes / 60.0;
        double extraCost = pricingStrategy.calculateCost(booking.getSpot().getHourlyRate(), additionalHours);

        booking.extendBooking(additionalMinutes);
        booking.setTotalAmount(booking.getTotalAmount() + extraCost);
        bookingRepository.save(booking);

        paymentService.addToExistingPayment(bookingId, extraCost);
    }

    public Booking getBookingById(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
    }

    public Booking editBooking(String bookingId, ParkingSpot newSpot, Vehicle newVehicle,
                                Instant newStartTime, int newDurationMinutes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if (booking.getStatus() == Booking.BookingStatusEnum.CANCELLED
                || booking.getStatus() == Booking.BookingStatusEnum.EXPIRED) {
            throw new IllegalStateException("Cannot edit a cancelled or expired booking");
        }

        boolean spotChanged = !booking.getSpotID().equals(newSpot.getSpotID());
        if (spotChanged) {
            if (!newSpot.isAvailable()) {
                throw new IllegalStateException("Selected spot is not available");
            }
            if (!newSpot.isBookableBy(newVehicle)) {
                throw new IllegalStateException("Vehicle is not eligible for this spot type");
            }
            spotService.updateStatus(booking.getSpotID(), ParkingSpot.SpotStatusEnum.AVAILABLE);
            spotService.updateStatus(newSpot.getSpotID(), ParkingSpot.SpotStatusEnum.RESERVED);
        }

        double newCost = pricingStrategy.calculateCost(newSpot.getHourlyRate(), newDurationMinutes / 60.0);
        booking.applyEdit(newSpot, newVehicle, newStartTime, newDurationMinutes);
        booking.setTotalAmount(newCost);
        paymentService.setPaymentAmount(bookingId, newCost);
        return bookingRepository.save(booking);
    }

    public void deleteBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        // Free the spot if booking was active
        if (booking.getStatus() == Booking.BookingStatusEnum.CONFIRMED
                || booking.getStatus() == Booking.BookingStatusEnum.EXTENDED) {
            spotService.updateStatus(booking.getSpotID(), ParkingSpot.SpotStatusEnum.AVAILABLE);
        }
        bookingRepository.deleteById(bookingId);
    }

    @Transactional(readOnly = true)
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Booking> getUserBookings(NormalUser user) {
        return bookingRepository.findByUser(user);
    }

    @Transactional(readOnly = true)
    public List<Booking> getUserActiveBookings(NormalUser user) {
        return bookingRepository.findByUserAndStatusIn(user,
                List.of(Booking.BookingStatusEnum.CONFIRMED, Booking.BookingStatusEnum.EXTENDED));
    }

    // Runs every minute to reserve spots for bookings starting in the next 30 minutes.
    @Scheduled(fixedRate = 60_000)
    public void activateUpcomingBookings() {
        Instant now = Instant.now();
        List<Booking> upcoming = bookingRepository.findConfirmedStartingBetween(
                now, now.plus(30, ChronoUnit.MINUTES));
        for (Booking booking : upcoming) {
            ParkingSpot spot = booking.getSpot();
            if (spot.getStatus() == ParkingSpot.SpotStatusEnum.AVAILABLE) {
                spotService.updateStatus(spot.getSpotID(), ParkingSpot.SpotStatusEnum.RESERVED);
            }
        }
    }

    // Runs every minute to expire bookings where the driver did not arrive within 5 minutes,
    // and to expire extended bookings whose end time has passed.
    @Scheduled(fixedRate = 60_000)
    public void processExpiredBookings() {
        Instant now = Instant.now();

        // No-show: CONFIRMED booking started > 5 min ago but spot not OCCUPIED
        Instant noShowCutoff = now.minus(5, ChronoUnit.MINUTES);
        List<Booking> noShows = bookingRepository.findByStatusAndStartTimeBefore(
                Booking.BookingStatusEnum.CONFIRMED, noShowCutoff);
        for (Booking booking : noShows) {
            ParkingSpot spot = booking.getSpot();
            if (spot.getStatus() != ParkingSpot.SpotStatusEnum.OCCUPIED) {
                booking.setStatus(Booking.BookingStatusEnum.EXPIRED);
                bookingRepository.save(booking);
                paymentService.refundPayment(booking.getBookingID());
                spotService.updateStatus(spot.getSpotID(), ParkingSpot.SpotStatusEnum.AVAILABLE);
            }
        }

        // Overtime: EXTENDED booking whose end time has passed
        List<Booking> overtime = bookingRepository.findByStatusAndEndTimeBefore(
                Booking.BookingStatusEnum.EXTENDED, now);
        for (Booking booking : overtime) {
            booking.setStatus(Booking.BookingStatusEnum.EXPIRED);
            bookingRepository.save(booking);
            spotService.updateStatus(booking.getSpotID(), ParkingSpot.SpotStatusEnum.AVAILABLE);
        }
    }
}
