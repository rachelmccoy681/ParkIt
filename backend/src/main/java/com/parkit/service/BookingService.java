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
        if (!spot.isAvailable()) {
            throw new IllegalStateException("Spot is not available");
        }
        if (!spot.isBookableBy(vehicle)) {
            throw new IllegalStateException("Vehicle is not eligible for this spot type");
        }

        double durationHours = durationMinutes / 60.0;
        double cost = pricingStrategy.calculateCost(spot.getHourlyRate(), durationHours);

        Booking booking = new Booking(user, spot, vehicle, startTime, durationMinutes);
        booking.setTotalAmount(cost);
        booking.setStatus(Booking.BookingStatusEnum.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        paymentService.processPayment(saved, user, cost);
        spotService.updateStatus(spot.getSpotID(), ParkingSpot.SpotStatusEnum.RESERVED);

        return saved;
    }

    public void cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        booking.cancelBooking();
        bookingRepository.save(booking);

        paymentService.refundPayment(bookingId);
        spotService.updateStatus(booking.getSpotID(), ParkingSpot.SpotStatusEnum.AVAILABLE);
    }

    public void extendBooking(String bookingId, int additionalMinutes) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        double additionalHours = additionalMinutes / 60.0;
        double extraCost = pricingStrategy.calculateCost(booking.getSpot().getHourlyRate(), additionalHours);

        booking.extendBooking(additionalMinutes);
        booking.setTotalAmount(booking.getTotalAmount() + extraCost);
        bookingRepository.save(booking);

        paymentService.addToExistingPayment(bookingId, extraCost);
    }

    @Transactional(readOnly = true)
    public List<Booking> getUserBookings(NormalUser user) {
        return bookingRepository.findByUser(user);
    }

    @Transactional(readOnly = true)
    public List<Booking> getUserActiveBookings(NormalUser user) {
        return bookingRepository.findByUserAndStatus(user, Booking.BookingStatusEnum.CONFIRMED);
    }

    // Runs every minute to expire bookings where the driver did not arrive within 5 minutes
    @Scheduled(fixedRate = 60_000)
    public void processExpiredBookings() {
        Instant cutoff = Instant.now().minus(5, ChronoUnit.MINUTES);
        List<Booking> candidates = bookingRepository.findByStatusAndStartTimeBefore(
                Booking.BookingStatusEnum.CONFIRMED, cutoff);

        for (Booking booking : candidates) {
            ParkingSpot spot = booking.getSpot();
            if (spot.getStatus() != ParkingSpot.SpotStatusEnum.OCCUPIED) {
                booking.setStatus(Booking.BookingStatusEnum.EXPIRED);
                bookingRepository.save(booking);

                paymentService.refundPayment(booking.getBookingID());
                spotService.updateStatus(spot.getSpotID(), ParkingSpot.SpotStatusEnum.AVAILABLE);
            }
        }
    }
}
