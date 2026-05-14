package com.parkit.dto;

import com.parkit.domain.model.Admin;
import com.parkit.domain.model.User;

public record AuthResponse(String token, String userId, String email, String role) {

    public static AuthResponse from(User user, String token) {
        String role = user instanceof Admin ? "ADMIN" : "USER";
        return new AuthResponse(token, user.getUserID(), user.getEmail(), role);
    }
}
