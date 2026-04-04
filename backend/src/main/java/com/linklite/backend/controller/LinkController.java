package com.linklite.backend.controller;

import com.linklite.backend.dto.ApiResponse;
import com.linklite.backend.dto.LinkDtos;
import com.linklite.backend.security.AuthenticatedUser;
import com.linklite.backend.service.LinkService;
import com.linklite.backend.util.SecurityUtils;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/links")
public class LinkController {

    private final LinkService linkService;

    public LinkController(LinkService linkService) {
        this.linkService = linkService;
    }

    @PostMapping
    public LinkDtos.LinkSummaryResponse create(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody LinkDtos.CreateLinkRequest request
    ) {
        return linkService.create(SecurityUtils.requireUser(principal), request);
    }

    @GetMapping
    public List<LinkDtos.LinkSummaryResponse> list(@AuthenticationPrincipal AuthenticatedUser principal) {
        return linkService.getUserLinks(SecurityUtils.requireUser(principal));
    }

    @GetMapping("/{id}")
    public LinkDtos.LinkDetailsResponse getDetails(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id
    ) {
        return linkService.getLinkDetails(SecurityUtils.requireUser(principal), id);
    }

    @PatchMapping("/{id}/status")
    public LinkDtos.LinkSummaryResponse updateStatus(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @RequestBody Map<String, Boolean> request
    ) {
        return linkService.updateStatus(SecurityUtils.requireUser(principal), id, Boolean.TRUE.equals(request.get("active")));
    }

    @PatchMapping("/{id}")
    public LinkDtos.LinkSummaryResponse updateLink(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @Valid @RequestBody LinkDtos.UpdateLinkRequest request
    ) {
        return linkService.updateLink(SecurityUtils.requireUser(principal), id, request);
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@AuthenticationPrincipal AuthenticatedUser principal, @PathVariable Long id) {
        linkService.delete(SecurityUtils.requireUser(principal), id);
        return new ApiResponse(true, "Link deleted successfully");
    }

    @PostMapping("/{id}/blocked-ips")
    public LinkDtos.BlockedIpResponse blockIp(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @Valid @RequestBody LinkDtos.BlockIpRequest request
    ) {
        return linkService.blockIp(SecurityUtils.requireUser(principal), id, request);
    }

    @DeleteMapping("/{id}/blocked-ips/{blockedIpId}")
    public ApiResponse unblockIp(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @PathVariable Long blockedIpId
    ) {
        linkService.unblockIp(SecurityUtils.requireUser(principal), id, blockedIpId);
        return new ApiResponse(true, "Blocked IP removed successfully");
    }

    @GetMapping("/{id}/export")
    public Map<String, String> export(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @RequestParam(defaultValue = "csv") String format
    ) {
        return Map.of(
            "format", format.toLowerCase(),
            "base64", linkService.exportVisits(SecurityUtils.requireUser(principal), id, format)
        );
    }
}
