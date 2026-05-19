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

    public NormalUser register(String email, String password, String username) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException("Email already registered");
        }
        if (userRepository.existsByUsername(username)) {
            throw new IllegalStateException("Username already taken");
        }
        NormalUser user = new NormalUser(email, passwordEncoder.encode(password), username);
        String code = generateCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
        NormalUser saved = normalUserRepository.save(user);
        emailService.sendVerificationEmail(email, code);
        return saved;
    }

    public void verifyEmail(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No user found with that email"));
        if (user.isEmailVerified()) {
            throw new IllegalStateException("Email already verified");
        }
        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            throw new IllegalArgumentException("Invalid verification code");
        }
        if (Instant.now().isAfter(user.getVerificationCodeExpiry())) {
            throw new IllegalArgumentException("Verification code has expired");
        }
        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);
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
