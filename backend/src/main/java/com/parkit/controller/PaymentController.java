package com.parkit.controller;

import com.parkit.domain.model.Payment;
import com.parkit.dto.PaymentResponse;
import com.parkit.service.PaymentService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<PaymentResponse> getByBooking(@PathVariable String bookingId,
                                                         Authentication authentication) {
        Payment payment = paymentService.getPaymentForBooking(bookingId);
        if (!payment.getUserID().equals(authentication.getName()) && !isAdmin(authentication)) {
            throw new SecurityException("Access denied");
        }
        return ResponseEntity.ok(PaymentResponse.from(payment));
    }

    @GetMapping("/my")
    public ResponseEntity<List<PaymentResponse>> getMyPayments(Authentication authentication) {
        return ResponseEntity.ok(
                paymentService.getPaymentsForUser(authentication.getName()).stream()
                        .map(PaymentResponse::from)
                        .toList()
        );
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}
