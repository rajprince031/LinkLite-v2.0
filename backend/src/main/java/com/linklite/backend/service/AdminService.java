package com.linklite.backend.service;

import com.linklite.backend.dto.AdminDtos;
import com.linklite.backend.entity.Account;
import com.linklite.backend.entity.AdminActionLog;
import com.linklite.backend.entity.FeedbackMessage;
import com.linklite.backend.entity.Link;
import com.linklite.backend.enums.AccountRole;
import com.linklite.backend.enums.AccountStatus;
import com.linklite.backend.repository.AccountRepository;
import com.linklite.backend.repository.AdminActionLogRepository;
import com.linklite.backend.repository.BlockedIpRepository;
import com.linklite.backend.repository.FeedbackMessageRepository;
import com.linklite.backend.repository.LinkRepository;
import com.linklite.backend.repository.LinkVisitRepository;
import com.linklite.backend.util.AppException;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final AccountRepository accountRepository;
    private final LinkRepository linkRepository;
    private final LinkVisitRepository linkVisitRepository;
    private final BlockedIpRepository blockedIpRepository;
    private final AdminActionLogRepository adminActionLogRepository;
    private final AdminActionLogService adminActionLogService;
    private final FeedbackMessageRepository feedbackMessageRepository;

    public AdminService(
        AccountRepository accountRepository,
        LinkRepository linkRepository,
        LinkVisitRepository linkVisitRepository,
        BlockedIpRepository blockedIpRepository,
        AdminActionLogRepository adminActionLogRepository,
        AdminActionLogService adminActionLogService,
        FeedbackMessageRepository feedbackMessageRepository
    ) {
        this.accountRepository = accountRepository;
        this.linkRepository = linkRepository;
        this.linkVisitRepository = linkVisitRepository;
        this.blockedIpRepository = blockedIpRepository;
        this.adminActionLogRepository = adminActionLogRepository;
        this.adminActionLogService = adminActionLogService;
        this.feedbackMessageRepository = feedbackMessageRepository;
    }

    @Transactional(readOnly = true)
    public AdminDtos.DashboardResponse getDashboard() {
        List<Account> users = accountRepository.findByRoleOrderByCreatedAtDesc(AccountRole.USER);
        List<Link> links = linkRepository.findAll();
        List<FeedbackMessage> feedbackMessages = feedbackMessageRepository.findTop10ByOrderByCreatedAtDesc();
        Instant now = Instant.now();

        List<AdminDtos.LinkAdminResponse> linkResponses = links.stream()
            .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
            .map(this::toLinkAdminResponse)
            .toList();

        List<AdminDtos.UserAdminResponse> userResponses = users.stream().map(user -> {
            List<Link> ownedLinks = links.stream().filter(link -> link.getCreator().getId().equals(user.getId())).toList();
            long totalClicks = ownedLinks.stream().mapToLong(Link::getClickCount).sum();
            return new AdminDtos.UserAdminResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getStatus(),
                user.isEmailVerified(),
                ownedLinks.size(),
                totalClicks,
                user.getCreatedAt(),
                user.getLastLoginAt(),
                ownedLinks.stream().map(this::toLinkAdminResponse).toList()
            );
        }).toList();

        return new AdminDtos.DashboardResponse(
            users.size(),
            users.stream().filter(user -> user.getStatus() == AccountStatus.ACTIVE).count(),
            users.stream().filter(user -> user.getStatus() == AccountStatus.INACTIVE).count(),
            users.stream().filter(user -> user.getStatus() == AccountStatus.BLOCKED).count(),
            users.stream().filter(Account::isEmailVerified).count(),
            links.size(),
            links.stream().filter(Link::isActive).count(),
            links.stream().filter(link -> !link.isActive()).count(),
            links.stream().filter(link -> link.getExpiresAt() != null && link.getExpiresAt().isBefore(now)).count(),
            links.stream().mapToLong(Link::getClickCount).sum(),
            feedbackMessageRepository.count(),
            buildTrafficByCountry(links),
            buildTopUsers(userResponses),
            buildTopLinks(linkResponses),
            users.stream().limit(5).map(user -> new AdminDtos.ActivityItem(
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getCreatedAt()
            )).toList(),
            linkResponses.stream().limit(5).map(link -> new AdminDtos.ActivityItem(
                link.title(),
                link.ownerEmail(),
                link.createdAt()
            )).toList(),
            adminActionLogRepository.findTop10ByOrderByCreatedAtDesc().stream().map(this::toActionHistoryItem).toList(),
            feedbackMessages.stream().map(this::toFeedbackItem).toList(),
            userResponses,
            linkResponses
        );
    }

    @Transactional
    public AdminDtos.UserAdminResponse updateStatus(Account admin, Long accountId, String rawStatus) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        if (account.getRole() == AccountRole.ADMIN) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Admin status cannot be changed here");
        }
        AccountStatus status;
        try {
            status = AccountStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (Exception exception) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid account status");
        }
        account.setStatus(status);
        List<Link> ownedLinks = linkRepository.findByCreatorOrderByCreatedAtDesc(account);
        long createdLinks = ownedLinks.size();
        long totalClicks = ownedLinks.stream().mapToLong(Link::getClickCount).sum();
        adminActionLogService.log(admin, "USER_" + status.name(), "USER", account.getId(), account.getEmail());
        return new AdminDtos.UserAdminResponse(
            account.getId(),
            account.getFirstName(),
            account.getLastName(),
            account.getEmail(),
            account.getStatus(),
            account.isEmailVerified(),
            createdLinks,
            totalClicks,
            account.getCreatedAt(),
            account.getLastLoginAt(),
            ownedLinks.stream().map(this::toLinkAdminResponse).toList()
        );
    }

    @Transactional
    public AdminDtos.LinkAdminResponse updateLinkStatus(Account admin, Long linkId, boolean active) {
        Link link = linkRepository.findById(linkId)
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Link not found"));
        link.setActive(active);
        adminActionLogService.log(admin, active ? "LINK_ACTIVATED" : "LINK_DEACTIVATED", "LINK", link.getId(), link.getTitle());
        return toLinkAdminResponse(link);
    }

    private AdminDtos.LinkAdminResponse toLinkAdminResponse(Link link) {
        var lastVisit = linkVisitRepository.findTopByLinkOrderByVisitedAtDesc(link);
        long blockedIpCount = blockedIpRepository.countByLink(link);
        boolean expired = link.getExpiresAt() != null && link.getExpiresAt().isBefore(Instant.now());
        String statusLabel = expired ? "EXPIRED" : (link.isActive() ? "ACTIVE" : "INACTIVE");
        String visibleCode = link.getCustomAlias() != null && !link.getCustomAlias().isBlank() ? link.getCustomAlias() : link.getShortCode();
        return new AdminDtos.LinkAdminResponse(
            link.getId(),
            link.getTitle(),
            link.getTargetUrl(),
            visibleCode,
            link.getCustomAlias(),
            link.getCreator().getFirstName() + " " + link.getCreator().getLastName(),
            link.getCreator().getEmail(),
            link.isActive(),
            statusLabel,
            link.getClickCount(),
            blockedIpCount,
            link.getCreatedAt(),
            link.getExpiresAt(),
            lastVisit != null ? lastVisit.getVisitedAt() : null
        );
    }

    private List<AdminDtos.SummaryMetric> buildTrafficByCountry(List<Link> links) {
        return links.stream()
            .flatMap(link -> linkVisitRepository.findByLinkOrderByVisitedAtDesc(link).stream())
            .filter(visit -> visit.getCountry() != null && !visit.getCountry().isBlank())
            .collect(java.util.stream.Collectors.groupingBy(visit -> visit.getCountry(), java.util.stream.Collectors.counting()))
            .entrySet().stream()
            .sorted((left, right) -> Long.compare(right.getValue(), left.getValue()))
            .limit(5)
            .map(entry -> new AdminDtos.SummaryMetric(entry.getKey(), entry.getValue(), "visits"))
            .toList();
    }

    private List<AdminDtos.SummaryMetric> buildTopUsers(List<AdminDtos.UserAdminResponse> users) {
        return users.stream()
            .sorted(Comparator.comparingLong(AdminDtos.UserAdminResponse::totalClicks).reversed())
            .limit(5)
            .map(user -> new AdminDtos.SummaryMetric(
                user.firstName() + " " + user.lastName(),
                user.totalClicks(),
                user.email()
            ))
            .toList();
    }

    private List<AdminDtos.SummaryMetric> buildTopLinks(List<AdminDtos.LinkAdminResponse> links) {
        return links.stream()
            .sorted(Comparator.comparingLong(AdminDtos.LinkAdminResponse::clickCount).reversed())
            .limit(5)
            .map(link -> new AdminDtos.SummaryMetric(link.title(), link.clickCount(), link.ownerEmail()))
            .toList();
    }

    private AdminDtos.ActionHistoryItem toActionHistoryItem(AdminActionLog log) {
        return new AdminDtos.ActionHistoryItem(
            log.getId(),
            log.getActionType(),
            log.getTargetType(),
            log.getTargetId(),
            log.getTargetLabel(),
            log.getPerformedBy(),
            log.getCreatedAt()
        );
    }

    private AdminDtos.FeedbackItem toFeedbackItem(FeedbackMessage feedbackMessage) {
        return new AdminDtos.FeedbackItem(
            feedbackMessage.getId(),
            feedbackMessage.getName(),
            feedbackMessage.getEmail(),
            feedbackMessage.getMessage(),
            feedbackMessage.getCreatedAt()
        );
    }
}
