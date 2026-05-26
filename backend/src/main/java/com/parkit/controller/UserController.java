package com.parkit.controller;

import com.parkit.dto.RegisterRequest;
import com.parkit.dto.UpdateEmailRequest;
import com.parkit.dto.UpdatePasswordRequest;
import com.parkit.dto.UpdateUsernameRequest;
import com.parkit.dto.UserResponse;
import com.parkit.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request.email(), request.password(), request.username());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getById(@PathVariable String userId, Authentication authentication) {
        requireSelfOrAdmin(userId, authentication);
        return ResponseEntity.ok(UserResponse.from(userService.findById(userId)));
    }

    @GetMapping("/by-email")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getByEmail(@RequestParam String email) {
        return ResponseEntity.ok(UserResponse.from(userService.findByEmail(email)));
    }

    @PutMapping("/{userId}/email")
    public ResponseEntity<Void> updateEmail(@PathVariable String userId,
                                             @Valid @RequestBody UpdateEmailRequest request,
                                             Authentication authentication) {
        requireSelfOrAdmin(userId, authentication);
        userService.updateEmail(userId, request.newEmail());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<Void> updatePassword(@PathVariable String userId,
                                                @Valid @RequestBody UpdatePasswordRequest request,
                                                Authentication authentication) {
        requireSelfOrAdmin(userId, authentication);
        userService.updatePassword(userId, request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/username")
    public ResponseEntity<Void> updateUsername(@PathVariable String userId,
                                               @Valid @RequestBody UpdateUsernameRequest request,
                                               Authentication authentication) {
        requireSelfOrAdmin(userId, authentication);
        userService.updateUsername(userId, request.newUsername());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> suspend(@PathVariable String userId) {
        userService.suspendUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> reactivate(@PathVariable String userId) {
        userService.reactivateUser(userId);
        return ResponseEntity.noContent().build();
    }

    private void requireSelfOrAdmin(String userId, Authentication authentication) {
        boolean isSelf = authentication.getName().equals(userId);
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isSelf && !isAdmin) {
            throw new SecurityException("Access denied");
        }
    }
}
