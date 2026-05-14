package com.parkit.dto;

import com.parkit.domain.model.Payment;
import java.time.Instant;

public record PaymentResponse(
        String paymentId,
        String bookingId,
        double amount,
        String status,
        Instant timestamp
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getPaymentID(),
                payment.getBookingID(),
                payment.getAmount(),
                payment.getStatus().name(),
                payment.getTimestamp()
        );
    }
}
