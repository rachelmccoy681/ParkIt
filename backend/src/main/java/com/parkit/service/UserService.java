package com.parkit.service;

import com.parkit.domain.model.NormalUser;
import com.parkit.domain.model.User;
import com.parkit.repository.NormalUserRepository;
import com.parkit.repository.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final NormalUserRepository normalUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final Random random = new Random();

    public UserService(UserRepository userRepository,
                       NormalUserRepository normalUserRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.normalUserRepository = normalUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    private record PendingEntry(String email, String hashedPassword, String username, String code, Instant expiry) {}
    private final java.util.concurrent.ConcurrentHashMap<String, PendingEntry> pending = new java.util.concurrent.ConcurrentHashMap<>();

    public void register(String email, String password, String username) {
        // Block if a verified account already exists for this email
        userRepository.findByEmail(email).ifPresent(u -> {
            if (u.isEmailVerified()) throw new IllegalStateException("Email already registered");
        });
        if (userRepository.existsByUsername(username)) {
            throw new IllegalStateException("Username already taken");
        }
        // Also block if another pending registration already claimed this username
        boolean usernamePending = pending.values().stream()
                .anyMatch(e -> e.username().equals(username) && !e.email().equals(email));
        if (usernamePending) {
            throw new IllegalStateException("Username already taken");
        }

        String code = generateCode();
        pending.put(email, new PendingEntry(
                email, passwordEncoder.encode(password), username, code,
                Instant.now().plus(15, ChronoUnit.MINUTES)));
        emailService.sendVerificationEmail(email, code);
    }

    public void verifyEmail(String email, String code) {
        PendingEntry entry = pending.get(email);
        if (entry == null) {
            throw new IllegalArgumentException("No pending registration for that email");
        }
        if (!entry.code().equals(code)) {
            throw new IllegalArgumentException("Invalid verification code");
        }
        if (Instant.now().isAfter(entry.expiry())) {
            pending.remove(email);
            throw new IllegalArgumentException("Verification code has expired");
        }
        NormalUser user = new NormalUser(entry.email(), entry.hashedPassword(), entry.username());
        user.setEmailVerified(true);
        normalUserRepository.save(user);
        pending.remove(email);
    }

    public void initiateForgotPassword(String email) {
        // No error if email not found — avoids email enumeration
        userRepository.findByEmail(email).ifPresent(user -> {
            String code = generateCode();
            user.setResetCode(code);
            user.setResetCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
            userRepository.save(user);
            emailService.sendPasswordResetEmail(email, code);
        });
    }

    public void resetPassword(String email, String code, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset code"));
        if (user.getResetCode() == null || !user.getResetCode().equals(code)
                || Instant.now().isAfter(user.getResetCodeExpiry())) {
            throw new IllegalArgumentException("Invalid or expired reset code");
        }
        user.resetPassword(passwordEncoder.encode(newPassword));
        user.setResetCode(null);
        user.setResetCodeExpiry(null);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No user found with that email"));
    }

    @Transactional(readOnly = true)
    public User findById(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public void suspendUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(false);
        userRepository.save(user);
    }

    public void reactivateUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setActive(true);
        userRepository.save(user);
    }

    public void updateEmail(String userId, String newEmail) {
        if (userRepository.existsByEmail(newEmail)) {
            throw new IllegalStateException("Email already in use");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setEmail(newEmail);
        userRepository.save(user);
    }

    public void updatePassword(String userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.resetPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void updateUsername(String userId, String newUsername) {
        if (userRepository.existsByUsername(newUsername)) {
            throw new IllegalStateException("Username already taken");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setUsername(newUsername);
        userRepository.save(user);
    }

    private String generateCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }
}
