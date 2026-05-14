package com.parkit.dto;

import com.parkit.domain.model.User;
import java.time.Instant;

public record UserResponse(String userId, String email, String username, Instant registeredDate, boolean active, boolean emailVerified) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getUserID(),
                user.getEmail(),
                user.getUsername(),
                user.getRegisteredDate(),
                user.isActive(),
                user.isEmailVerified()
        );
    }
}
