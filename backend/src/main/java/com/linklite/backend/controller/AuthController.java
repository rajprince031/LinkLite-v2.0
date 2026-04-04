package com.linklite.backend.controller;

import com.linklite.backend.dto.ApiResponse;
import com.linklite.backend.dto.AuthDtos;
import com.linklite.backend.enums.AccountRole;
import com.linklite.backend.security.AuthenticatedUser;
import com.linklite.backend.service.AuthService;
import com.linklite.backend.util.SecurityUtils;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/signup")
    public ApiResponse signup(@Valid @RequestBody AuthDtos.RegisterRequest request) {
        return new ApiResponse(true, authService.register(request));
    }

    @PostMapping("/auth/verify-otp")
    public ApiResponse verifyOtp(@Valid @RequestBody AuthDtos.VerifyOtpRequest request) {
        return new ApiResponse(true, authService.verifyOtp(request));
    }

    @PostMapping("/auth/resend-otp/{email}")
    public ApiResponse resendOtp(@PathVariable String email) {
        return new ApiResponse(true, authService.resendOtp(email));
    }

    @PostMapping("/auth/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request, AccountRole.USER);
    }

    @PostMapping("/auth/forgot-password")
    public ApiResponse forgotPassword(@Valid @RequestBody AuthDtos.ForgotPasswordRequest request) {
        return new ApiResponse(true, authService.forgotPassword(request));
    }

    @PostMapping("/auth/reset-password")
    public ApiResponse resetPassword(@Valid @RequestBody AuthDtos.ResetPasswordRequest request) {
        return new ApiResponse(true, authService.resetPassword(request));
    }

    @PostMapping("/admin/login")
    public AuthDtos.AuthResponse adminLogin(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request, AccountRole.ADMIN);
    }

    @GetMapping("/auth/me")
    public AuthDtos.ProfileResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return authService.toProfile(SecurityUtils.requireUser(principal));
    }
}
