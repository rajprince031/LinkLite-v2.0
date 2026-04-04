package com.linklite.backend.dto;

import com.linklite.backend.enums.AccountStatus;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;

public class AdminDtos {

    public record DashboardResponse(
        long totalUsers,
        long activeUsers,
        long inactiveUsers,
        long blockedUsers,
        long verifiedUsers,
        long totalLinks,
        long activeLinks,
        long inactiveLinks,
        long expiredLinks,
        long totalClicks,
        long totalFeedback,
        List<SummaryMetric> trafficByCountry,
        List<SummaryMetric> topUsers,
        List<SummaryMetric> topLinks,
        List<ActivityItem> recentUsers,
        List<ActivityItem> recentLinks,
        List<ActionHistoryItem> actionHistory,
        List<FeedbackItem> feedback,
        List<UserAdminResponse> users,
        List<LinkAdminResponse> links
    ) {
    }

    public record SummaryMetric(String label, long value, String subLabel) {
    }

    public record ActivityItem(String title, String subtitle, Instant createdAt) {
    }

    public record ActionHistoryItem(Long id, String actionType, String targetType, Long targetId, String targetLabel, String performedBy, Instant createdAt) {
    }

    public record FeedbackItem(Long id, String name, String email, String message, Instant createdAt) {
    }

    public record UserAdminResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        AccountStatus status,
        boolean emailVerified,
        long createdLinks,
        long totalClicks,
        Instant createdAt,
        Instant lastLoginAt,
        List<LinkAdminResponse> links
    ) {
    }

    public record LinkAdminResponse(
        Long id,
        String title,
        String targetUrl,
        String shortUrl,
        String customAlias,
        String ownerName,
        String ownerEmail,
        boolean active,
        String statusLabel,
        long clickCount,
        long blockedIpCount,
        Instant createdAt,
        Instant expiresAt,
        Instant lastVisitedAt
    ) {
    }

    public record UpdateAccountStatusRequest(@NotBlank String status) {
    }

    public record UpdateLinkStatusRequest(boolean active) {
    }
}
