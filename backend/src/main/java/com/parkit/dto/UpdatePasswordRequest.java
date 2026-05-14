package com.parkit.dto;

import com.parkit.validation.ValidPassword;
import jakarta.validation.constraints.NotBlank;

public record UpdatePasswordRequest(@NotBlank @ValidPassword String newPassword) {}
