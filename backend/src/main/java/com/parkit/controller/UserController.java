package com.parkit.controller;

import com.parkit.dto.RegisterRequest;
import com.parkit.dto.UpdateEmailRequest;
import com.parkit.dto.UpdatePasswordRequest;
import com.parkit.dto.UserResponse;
import com.parkit.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        var user = userService.register(request.email(), request.password(), request.username());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getById(@PathVariable String userId) {
        return ResponseEntity.ok(UserResponse.from(userService.findById(userId)));
    }

    @GetMapping("/by-email")
    public ResponseEntity<UserResponse> getByEmail(@RequestParam String email) {
        return ResponseEntity.ok(UserResponse.from(userService.findByEmail(email)));
    }

    @PutMapping("/{userId}/email")
    public ResponseEntity<Void> updateEmail(@PathVariable String userId,
                                             @Valid @RequestBody UpdateEmailRequest request) {
        userService.updateEmail(userId, request.newEmail());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<Void> updatePassword(@PathVariable String userId,
                                                @Valid @RequestBody UpdatePasswordRequest request) {
        userService.updatePassword(userId, request.newPassword());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/suspend")
    public ResponseEntity<Void> suspend(@PathVariable String userId) {
        userService.suspendUser(userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{userId}/reactivate")
    public ResponseEntity<Void> reactivate(@PathVariable String userId) {
        userService.reactivateUser(userId);
        return ResponseEntity.noContent().build();
    }
}
