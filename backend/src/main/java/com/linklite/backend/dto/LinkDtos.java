package com.linklite.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public class LinkDtos {

    public record CreateLinkRequest(
        @NotBlank @Size(max = 60, message = "Title must be at most 60 characters") String title,
        @NotBlank String targetUrl,
        @Size(max = 24, message = "Custom alias must be at most 24 characters")
        String customAlias,
        boolean active,
        Instant expiresAt
    ) {
    }

    public record UpdateLinkRequest(
        @NotBlank @Size(max = 60, message = "Title must be at most 60 characters") String title,
        @Size(max = 24, message = "Custom alias must be at most 24 characters")
        String customAlias,
        Instant expiresAt
    ) {
    }

    public record LinkSummaryResponse(
        Long id,
        String title,
        String targetUrl,
        String shortCode,
        String customAlias,
        String shortUrl,
        boolean active,
        Instant expiresAt,
        long clickCount,
        String qrCodeDataUrl,
        Instant createdAt
    ) {
    }

    public record BlockIpRequest(@NotBlank @Pattern(regexp = "^[0-9a-fA-F:.]+$") String ipAddress, String reason) {
    }

    public record BlockedIpResponse(Long id, String ipAddress, String reason, Instant createdAt) {
    }

    public record VisitResponse(
        Long id,
        String ipAddress,
        String country,
        String region,
        String city,
        String browser,
        String os,
        String deviceType,
        String userAgent,
        String referrer,
        boolean blocked,
        Instant visitedAt
    ) {
    }

    public record LinkDetailsResponse(
        LinkSummaryResponse link,
        List<VisitResponse> visits,
        List<BlockedIpResponse> blockedIps
    ) {
    }
}
