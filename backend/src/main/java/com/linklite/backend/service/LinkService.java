package com.linklite.backend.service;

import com.linklite.backend.dto.DashboardDtos;
import com.linklite.backend.dto.LinkDtos;
import com.linklite.backend.entity.Account;
import com.linklite.backend.entity.BlockedIp;
import com.linklite.backend.entity.Link;
import com.linklite.backend.entity.LinkVisit;
import com.linklite.backend.repository.BlockedIpRepository;
import com.linklite.backend.repository.LinkRepository;
import com.linklite.backend.repository.LinkVisitRepository;
import com.linklite.backend.enums.AccountStatus;
import com.linklite.backend.util.AppException;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LinkService {

    private static final String CODE_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private final LinkRepository linkRepository;
    private final LinkVisitRepository linkVisitRepository;
    private final BlockedIpRepository blockedIpRepository;
    private final GeoLocationService geoLocationService;
    private final QrCodeService qrCodeService;
    private final String baseUrl;
    private final SecureRandom secureRandom = new SecureRandom();

    public LinkService(
        LinkRepository linkRepository,
        LinkVisitRepository linkVisitRepository,
        BlockedIpRepository blockedIpRepository,
        GeoLocationService geoLocationService,
        QrCodeService qrCodeService,
        @Value("${app.base-url}") String baseUrl
    ) {
        this.linkRepository = linkRepository;
        this.linkVisitRepository = linkVisitRepository;
        this.blockedIpRepository = blockedIpRepository;
        this.geoLocationService = geoLocationService;
        this.qrCodeService = qrCodeService;
        this.baseUrl = baseUrl;
    }

    @Transactional
    public LinkDtos.LinkSummaryResponse create(Account account, LinkDtos.CreateLinkRequest request) {
        Link link = new Link();
        link.setTitle(request.title().trim());
        link.setTargetUrl(validateTargetUrl(request.targetUrl()));
        link.setActive(request.active());
        link.setCreator(account);
        link.setExpiresAt(request.expiresAt());

        String alias = normalizeAlias(request.customAlias());
        if (alias != null && linkRepository.existsByCustomAlias(alias)) {
            throw new AppException(HttpStatus.CONFLICT, "Custom alias is already in use");
        }
        link.setCustomAlias(alias);
        link.setShortCode(generateUniqueCode());
        linkRepository.save(link);
        return toSummary(link);
    }

    public List<LinkDtos.LinkSummaryResponse> getUserLinks(Account account) {
        return linkRepository.findByCreatorOrderByCreatedAtDesc(account).stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public DashboardDtos.UserDashboardResponse getUserDashboard(Account account) {
        List<Link> links = linkRepository.findByCreatorOrderByCreatedAtDesc(account);
        Instant now = Instant.now();
        long totalClicks = links.stream().mapToLong(Link::getClickCount).sum();
        long blockedIps = links.stream().mapToLong(blockedIpRepository::countByLink).sum();

        List<DashboardDtos.LinkTableItem> tableItems = links.stream().map(link -> {
            boolean expired = link.getExpiresAt() != null && link.getExpiresAt().isBefore(now);
            String statusLabel = expired ? "Expired" : (link.isActive() ? "Active" : "Inactive");
            String alias = link.getCustomAlias() != null && !link.getCustomAlias().isBlank() ? link.getCustomAlias() : link.getShortCode();
            String shortUrl = buildShortUrl(alias);
            return new DashboardDtos.LinkTableItem(
                link.getId(),
                link.getTitle(),
                shortUrl,
                link.getTargetUrl(),
                alias,
                qrCodeService.generatePngDataUrl(shortUrl),
                link.isActive(),
                statusLabel,
                link.getClickCount(),
                blockedIpRepository.countByLink(link),
                link.getExpiresAt(),
                link.getCreatedAt()
            );
        }).toList();

        var visits = links.stream()
            .flatMap(link -> linkVisitRepository.findByLinkOrderByVisitedAtDesc(link).stream())
            .toList();

        return new DashboardDtos.UserDashboardResponse(
            links.size(),
            links.stream().filter(Link::isActive).count(),
            totalClicks,
            links.stream().filter(link -> link.getExpiresAt() != null && link.getExpiresAt().isBefore(now.plus(2, ChronoUnit.DAYS)) && link.getExpiresAt().isAfter(now)).count(),
            blockedIps,
            aggregateMetrics(visits, LinkDtos.VisitResponse::country),
            aggregateMetrics(visits, LinkDtos.VisitResponse::browser),
            aggregateMetrics(visits, LinkDtos.VisitResponse::deviceType),
            visits.stream().sorted((left, right) -> right.getVisitedAt().compareTo(left.getVisitedAt()))
                .map(visit -> {
                    Link link = visit.getLink();
                    String alias = link.getCustomAlias() != null && !link.getCustomAlias().isBlank() ? link.getCustomAlias() : link.getShortCode();
                    String shortUrl = buildShortUrl(alias);
                    return new DashboardDtos.VisitActivityItem(
                        link.getId(),
                        link.getTitle(),
                        alias,
                        shortUrl,
                        link.getTargetUrl(),
                        visit.getIpAddress(),
                        visit.getCountry(),
                        visit.getRegion(),
                        visit.getCity(),
                        visit.getBrowser(),
                        visit.getOs(),
                        visit.getDeviceType(),
                        visit.getUserAgent(),
                        visit.getReferrer(),
                        visit.isBlocked(),
                        visit.getVisitedAt()
                    );
                }).toList(),
            links.stream()
                .map(link -> new DashboardDtos.ActivityItem(
                    link.getTitle(),
                    link.getCustomAlias() != null ? link.getCustomAlias() : link.getShortCode(),
                    link.getCreatedAt(),
                    link.isActive() ? "active" : "inactive"
                )).toList(),
            buildUserNotifications(links, now),
            tableItems
        );
    }

    public LinkDtos.LinkDetailsResponse getLinkDetails(Account account, Long id) {
        Link link = getOwnedLink(account, id);
        return new LinkDtos.LinkDetailsResponse(
            toSummary(link),
            linkVisitRepository.findByLinkOrderByVisitedAtDesc(link).stream().map(this::toVisitResponse).toList(),
            blockedIpRepository.findByLinkOrderByCreatedAtDesc(link).stream().map(this::toBlockedIpResponse).toList()
        );
    }

    @Transactional
    public LinkDtos.LinkSummaryResponse updateStatus(Account account, Long id, boolean active) {
        Link link = getOwnedLink(account, id);
        if (active && account.getStatus() == AccountStatus.INACTIVE) {
            throw new AppException(HttpStatus.FORBIDDEN, "Go to profile and activate your account before enabling links");
        }
        if (active && account.getStatus() == AccountStatus.DELETION_PENDING) {
            throw new AppException(HttpStatus.FORBIDDEN, "Cancel account deletion from your next login before enabling links");
        }
        link.setActive(active);
        if (link.getActiveBeforeAccountPause() != null && !active) {
            link.setActiveBeforeAccountPause(Boolean.FALSE);
        }
        return toSummary(link);
    }

    @Transactional
    public LinkDtos.LinkSummaryResponse updateLink(Account account, Long id, LinkDtos.UpdateLinkRequest request) {
        Link link = getOwnedLink(account, id);
        link.setTitle(request.title().trim());
        String alias = normalizeAlias(request.customAlias());
        if (alias != null) {
            linkRepository.findByCustomAlias(alias).ifPresent(existing -> {
                if (!existing.getId().equals(link.getId())) {
                    throw new AppException(HttpStatus.CONFLICT, "Custom alias is already in use");
                }
            });
        }
        link.setCustomAlias(alias);
        link.setExpiresAt(request.expiresAt());
        return toSummary(link);
    }

    @Transactional
    public void delete(Account account, Long id) {
        linkRepository.delete(getOwnedLink(account, id));
    }

    @Transactional
    public LinkDtos.BlockedIpResponse blockIp(Account account, Long linkId, LinkDtos.BlockIpRequest request) {
        Link link = getOwnedLink(account, linkId);
        blockedIpRepository.findByLinkAndIpAddress(link, request.ipAddress()).ifPresent(existing -> {
            throw new AppException(HttpStatus.CONFLICT, "IP address is already blocked for this link");
        });
        BlockedIp blockedIp = new BlockedIp();
        blockedIp.setLink(link);
        blockedIp.setIpAddress(request.ipAddress().trim());
        blockedIp.setReason(request.reason());
        blockedIpRepository.save(blockedIp);
        return toBlockedIpResponse(blockedIp);
    }

    @Transactional
    public void unblockIp(Account account, Long linkId, Long blockedIpId) {
        Link link = getOwnedLink(account, linkId);
        BlockedIp blockedIp = blockedIpRepository.findById(blockedIpId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Blocked IP not found"));
        if (!blockedIp.getLink().getId().equals(link.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "Blocked IP does not belong to this link");
        }
        blockedIpRepository.delete(blockedIp);
    }

    @Transactional
    public String exportVisits(Account account, Long linkId, String format) {
        Link link = getOwnedLink(account, linkId);
        List<LinkVisit> visits = linkVisitRepository.findByLinkOrderByVisitedAtDesc(link);
        if ("json".equalsIgnoreCase(format)) {
            String payload = visits.stream()
                .map(visit -> String.format(
                    "{\"ipAddress\":\"%s\",\"country\":\"%s\",\"region\":\"%s\",\"city\":\"%s\",\"browser\":\"%s\",\"os\":\"%s\",\"deviceType\":\"%s\",\"visitedAt\":\"%s\"}",
                    safe(visit.getIpAddress()), safe(visit.getCountry()), safe(visit.getRegion()), safe(visit.getCity()),
                    safe(visit.getBrowser()), safe(visit.getOs()), safe(visit.getDeviceType()), visit.getVisitedAt()
                ))
                .reduce((left, right) -> left + "," + right)
                .map(body -> "[" + body + "]")
                .orElse("[]");
            return Base64.getEncoder().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        }
        StringBuilder csv = new StringBuilder("ipAddress,country,region,city,browser,os,deviceType,visitedAt\n");
        for (LinkVisit visit : visits) {
            csv.append(String.join(",",
                csvSafe(visit.getIpAddress()),
                csvSafe(visit.getCountry()),
                csvSafe(visit.getRegion()),
                csvSafe(visit.getCity()),
                csvSafe(visit.getBrowser()),
                csvSafe(visit.getOs()),
                csvSafe(visit.getDeviceType()),
                visit.getVisitedAt().toString()
            )).append('\n');
        }
        return Base64.getEncoder().encodeToString(csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    @Transactional
    public String resolveAndTrack(String code, HttpServletRequest request) {
        Link link = linkRepository.findByCustomAlias(code)
            .or(() -> linkRepository.findByShortCode(code))
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Link not found"));

        if (!link.isActive()) {
            throw new AppException(HttpStatus.GONE, "This link is inactive");
        }
        if (link.getExpiresAt() != null && link.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(HttpStatus.GONE, "This link has expired");
        }

        String ipAddress = extractIp(request);
        boolean blocked = blockedIpRepository.findByLinkAndIpAddress(link, ipAddress).isPresent();
        if (blocked) {
            throw new AppException(HttpStatus.FORBIDDEN, "This IP address is blocked for the link");
        }

        Map<String, String> geo = geoLocationService.resolve(ipAddress);
        LinkVisit visit = new LinkVisit();
        visit.setLink(link);
        visit.setIpAddress(ipAddress);
        visit.setCountry(geo.get("country"));
        visit.setRegion(geo.get("region"));
        visit.setCity(geo.get("city"));
        visit.setBrowser(parseBrowser(request.getHeader("User-Agent")));
        visit.setOs(parseOs(request.getHeader("User-Agent")));
        visit.setDeviceType(parseDevice(request.getHeader("User-Agent")));
        visit.setUserAgent(request.getHeader("User-Agent"));
        visit.setReferrer(request.getHeader("Referer"));
        visit.setBlocked(false);
        linkVisitRepository.save(visit);
        link.setClickCount(link.getClickCount() + 1);
        return validateTargetUrl(link.getTargetUrl());
    }

    public Link getOwnedLink(Account account, Long id) {
        Link link = linkRepository.findById(id).orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Link not found"));
        if (!link.getCreator().getId().equals(account.getId())) {
            throw new AppException(HttpStatus.FORBIDDEN, "You do not own this link");
        }
        return link;
    }

    public LinkDtos.LinkSummaryResponse toSummary(Link link) {
        String visibleCode = link.getCustomAlias() != null && !link.getCustomAlias().isBlank() ? link.getCustomAlias() : link.getShortCode();
        String shortUrl = buildShortUrl(visibleCode);
        return new LinkDtos.LinkSummaryResponse(
            link.getId(),
            link.getTitle(),
            link.getTargetUrl(),
            link.getShortCode(),
            link.getCustomAlias(),
            shortUrl,
            link.isActive(),
            link.getExpiresAt(),
            link.getClickCount(),
            qrCodeService.generatePngDataUrl(shortUrl),
            link.getCreatedAt()
        );
    }

    private String buildShortUrl(String code) {
        String normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        return normalizedBaseUrl + "/" + code;
    }

    public LinkDtos.VisitResponse toVisitResponse(LinkVisit visit) {
        return new LinkDtos.VisitResponse(
            visit.getId(),
            visit.getIpAddress(),
            visit.getCountry(),
            visit.getRegion(),
            visit.getCity(),
            visit.getBrowser(),
            visit.getOs(),
            visit.getDeviceType(),
            visit.getUserAgent(),
            visit.getReferrer(),
            visit.isBlocked(),
            visit.getVisitedAt()
        );
    }

    private List<DashboardDtos.MetricItem> aggregateMetrics(List<LinkVisit> visits, java.util.function.Function<LinkDtos.VisitResponse, String> mapper) {
        return visits.stream()
            .map(this::toVisitResponse)
            .map(mapper)
            .filter(value -> value != null && !value.isBlank() && !"Unknown".equalsIgnoreCase(value))
            .collect(java.util.stream.Collectors.groupingBy(value -> value, java.util.stream.Collectors.counting()))
            .entrySet().stream()
            .sorted((left, right) -> Long.compare(right.getValue(), left.getValue()))
            .limit(5)
            .map(entry -> new DashboardDtos.MetricItem(entry.getKey(), entry.getValue(), "visits"))
            .toList();
    }

    private List<DashboardDtos.ActivityItem> buildUserNotifications(List<Link> links, Instant now) {
        return links.stream()
            .filter(link ->
                (link.getExpiresAt() != null && link.getExpiresAt().isBefore(now.plus(2, ChronoUnit.DAYS)) && link.getExpiresAt().isAfter(now))
                    || blockedIpRepository.countByLink(link) > 0
            )
            .limit(6)
            .map(link -> new DashboardDtos.ActivityItem(
                link.getTitle(),
                link.getExpiresAt() != null && link.getExpiresAt().isBefore(now.plus(2, ChronoUnit.DAYS)) && link.getExpiresAt().isAfter(now)
                    ? "Expires soon"
                    : blockedIpRepository.countByLink(link) + " blocked IPs",
                link.getUpdatedAt(),
                link.isActive() ? "warning" : "inactive"
            )).toList();
    }

    public LinkDtos.BlockedIpResponse toBlockedIpResponse(BlockedIp blockedIp) {
        return new LinkDtos.BlockedIpResponse(
            blockedIp.getId(),
            blockedIp.getIpAddress(),
            blockedIp.getReason(),
            blockedIp.getCreatedAt()
        );
    }

    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                builder.append(CODE_CHARS.charAt(secureRandom.nextInt(CODE_CHARS.length())));
            }
            code = builder.toString();
        } while (linkRepository.existsByShortCode(code));
        return code;
    }

    private String validateTargetUrl(String rawValue) {
        String value = rawValue == null ? "" : rawValue.trim();
        try {
            URI uri = new URI(value);
            if (uri.getScheme() == null || uri.getHost() == null) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Destination link is not valid");
            }
            String scheme = uri.getScheme().toLowerCase();
            if (!"http".equals(scheme) && !"https".equals(scheme)) {
                throw new AppException(HttpStatus.BAD_REQUEST, "Destination link must use http or https");
            }
            return value;
        } catch (URISyntaxException exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Destination link is not valid");
        }
    }

    private String normalizeAlias(String alias) {
        if (alias == null || alias.isBlank()) {
            return null;
        }
        String normalized = alias.trim().replaceAll("[^a-zA-Z0-9_-]", "").toLowerCase();
        if (normalized.isBlank()) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Custom alias must contain letters, numbers, hyphens, or underscores");
        }
        return normalized;
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String parseBrowser(String userAgent) {
        if (userAgent == null) {
            return "Unknown";
        }
        if (userAgent.contains("Edg")) return "Edge";
        if (userAgent.contains("Chrome")) return "Chrome";
        if (userAgent.contains("Firefox")) return "Firefox";
        if (userAgent.contains("Safari")) return "Safari";
        return "Unknown";
    }

    private String parseOs(String userAgent) {
        if (userAgent == null) {
            return "Unknown";
        }
        if (userAgent.contains("Windows")) return "Windows";
        if (userAgent.contains("Mac OS")) return "macOS";
        if (userAgent.contains("Android")) return "Android";
        if (userAgent.contains("iPhone") || userAgent.contains("iPad")) return "iOS";
        if (userAgent.contains("Linux")) return "Linux";
        return "Unknown";
    }

    private String parseDevice(String userAgent) {
        if (userAgent == null) {
            return "Unknown";
        }
        if (userAgent.contains("Mobile")) return "Mobile";
        if (userAgent.contains("Tablet")) return "Tablet";
        return "Desktop";
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("\"", "'");
    }

    private String csvSafe(String value) {
        return "\"" + safe(value) + "\"";
    }
}
