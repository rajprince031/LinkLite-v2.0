package com.linklite.backend.dto;

import java.time.Instant;
import java.util.List;

public class DashboardDtos {

    public record MetricItem(String label, long value, String helper) {
    }

    public record ActivityItem(String title, String subtitle, Instant timestamp, String status) {
    }

    public record VisitActivityItem(
        Long linkId,
        String linkTitle,
        String alias,
        String shortUrl,
        String targetUrl,
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
        Instant timestamp
    ) {
    }

    public record UserDashboardResponse(
        long totalLinks,
        long activeLinks,
        long totalClicks,
        long expiringSoon,
        long blockedIps,
        List<MetricItem> topCountries,
        List<MetricItem> topBrowsers,
        List<MetricItem> topDevices,
        List<VisitActivityItem> recentClicks,
        List<ActivityItem> recentLinks,
        List<ActivityItem> notifications,
        List<LinkTableItem> links
    ) {
    }

    public record LinkTableItem(
        Long id,
        String title,
        String shortUrl,
        String targetUrl,
        String alias,
        String qrCodeDataUrl,
        boolean active,
        String statusLabel,
        long clicks,
        long blockedIpCount,
        Instant expiresAt,
        Instant createdAt
    ) {
    }
}
