package com.parkit.dto;

import com.parkit.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @ValidPassword String password,
        @NotBlank String username
) {}
