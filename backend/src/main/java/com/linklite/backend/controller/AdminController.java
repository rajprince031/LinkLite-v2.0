package com.linklite.backend.controller;

import com.linklite.backend.dto.AdminDtos;
import com.linklite.backend.security.AuthenticatedUser;
import com.linklite.backend.service.AdminService;
import com.linklite.backend.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public AdminDtos.DashboardResponse dashboard(@AuthenticationPrincipal AuthenticatedUser principal) {
        SecurityUtils.requireAdmin(principal);
        return adminService.getDashboard();
    }

    @PatchMapping("/users/{id}/status")
    public AdminDtos.UserAdminResponse updateStatus(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @Valid @RequestBody AdminDtos.UpdateAccountStatusRequest request
    ) {
        var admin = SecurityUtils.requireAdmin(principal);
        return adminService.updateStatus(admin, id, request.status());
    }

    @PatchMapping("/links/{id}/status")
    public AdminDtos.LinkAdminResponse updateLinkStatus(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @PathVariable Long id,
        @RequestBody AdminDtos.UpdateLinkStatusRequest request
    ) {
        var admin = SecurityUtils.requireAdmin(principal);
        return adminService.updateLinkStatus(admin, id, request.active());
    }
}
