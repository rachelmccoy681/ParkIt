package com.parkit.repository;

import com.parkit.domain.model.Booking;
import com.parkit.domain.model.Payment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, String> {

    Optional<Payment> findByBooking(Booking booking);

    @Query("SELECT p FROM Payment p WHERE p.booking.bookingID = :bookingId")
    Optional<Payment> findByBookingId(@Param("bookingId") String bookingId);

    @Query("SELECT p FROM Payment p WHERE p.user.userID = :userId ORDER BY p.timestamp DESC")
    List<Payment> findByUserId(@Param("userId") String userId);
}
