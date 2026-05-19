package com.parkit.service;

import com.parkit.domain.model.Booking;
import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.Payment;
import com.parkit.repository.PaymentRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public Payment processPayment(Booking booking, NormalUser user, double amount) {
        Payment payment = new Payment(booking, user, amount);
        payment.processPayment();
        return paymentRepository.save(payment);
    }

    public void addToExistingPayment(String bookingId, double additionalAmount) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for booking"));
        payment.addAmount(additionalAmount);
        paymentRepository.save(payment);
    }

    public void setPaymentAmount(String bookingId, double newTotalAmount) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for booking"));
        payment.setAmount(newTotalAmount);
        paymentRepository.save(payment);
    }

    public void refundPayment(String bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for booking"));
        payment.refundPayment();
        paymentRepository.save(payment);
    }

    @Transactional(readOnly = true)
    public Payment getPaymentForBooking(String bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("No payment found for booking"));
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsForUser(String userId) {
        return paymentRepository.findByUserId(userId);
    }
}
