package com.linklite.backend.dto;

import com.linklite.backend.enums.AccountRole;
import com.linklite.backend.enums.AccountStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class AuthDtos {

    public record RegisterRequest(
        @NotBlank @Size(max = 30, message = "First name must be at most 30 characters") String firstName,
        @Size(max = 30, message = "Last name must be at most 30 characters") String lastName,
        @NotBlank @Email String email,
        @NotBlank
        @Size(min = 8, message = "Password must be at least 8 characters long")
        @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
            message = "Password must contain at least one letter and one number"
        ) String password,
        Boolean replacePending
    ) {
    }

    public record VerifyOtpRequest(@NotBlank @Email String email, @NotBlank @Size(min = 6, max = 6) String otp) {
    }

    public record ForgotPasswordRequest(@NotBlank @Email String email) {
    }

    public record ResetPasswordRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 6) String otp,
        @NotBlank
        @Size(min = 8, message = "Password must be at least 8 characters long")
        @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
            message = "Password must contain at least one letter and one number"
        ) String newPassword
    ) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
    }

    public record ProfileResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        AccountRole role,
        AccountStatus status,
        boolean emailVerified,
        Instant createdAt
    ) {
    }

    public record AuthResponse(String token, ProfileResponse user) {
    }

    public record UpdateProfileRequest(
        @NotBlank @Size(max = 30, message = "First name must be at most 30 characters") String firstName,
        @Size(max = 30, message = "Last name must be at most 30 characters") String lastName
    ) {
    }

    public record ChangePasswordRequest(@NotBlank String currentPassword, @NotBlank @Size(min = 8) String newPassword) {
    }
}
