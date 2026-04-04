package com.linklite.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public class FeedbackDtos {

    public record FeedbackRequest(
        @NotBlank @Size(max = 60, message = "Name must be at most 60 characters") String name,
        @NotBlank @Email(message = "Enter a valid email address") @Size(max = 120, message = "Email must be at most 120 characters") String email,
        @NotBlank @Size(max = 2000, message = "Message must be at most 2000 characters") String message
    ) {
    }

    public record FeedbackResponse(
        Long id,
        String name,
        String email,
        String message,
        Instant createdAt
    ) {
    }
}
