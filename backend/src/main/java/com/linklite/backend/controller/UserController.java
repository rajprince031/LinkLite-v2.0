package com.linklite.backend.controller;

import com.linklite.backend.dto.ApiResponse;
import com.linklite.backend.dto.AuthDtos;
import com.linklite.backend.dto.DashboardDtos;
import com.linklite.backend.security.AuthenticatedUser;
import com.linklite.backend.service.LinkService;
import com.linklite.backend.service.UserService;
import com.linklite.backend.util.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final LinkService linkService;

    public UserController(UserService userService, LinkService linkService) {
        this.userService = userService;
        this.linkService = linkService;
    }

    @GetMapping("/me")
    public AuthDtos.ProfileResponse getProfile(@AuthenticationPrincipal AuthenticatedUser principal) {
        return userService.getProfile(SecurityUtils.requireUser(principal));
    }

    @GetMapping("/me/dashboard")
    public DashboardDtos.UserDashboardResponse getDashboard(@AuthenticationPrincipal AuthenticatedUser principal) {
        return linkService.getUserDashboard(SecurityUtils.requireUser(principal));
    }

    @PatchMapping("/me")
    public AuthDtos.ProfileResponse updateProfile(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody AuthDtos.UpdateProfileRequest request
    ) {
        return userService.updateProfile(SecurityUtils.requireUser(principal), request);
    }

    @PatchMapping("/me/password")
    public ApiResponse changePassword(
        @AuthenticationPrincipal AuthenticatedUser principal,
        @Valid @RequestBody AuthDtos.ChangePasswordRequest request
    ) {
        return new ApiResponse(true, userService.changePassword(SecurityUtils.requireUser(principal), request));
    }

    @PatchMapping("/me/deactivate")
    public ApiResponse deactivateOwnAccount(@AuthenticationPrincipal AuthenticatedUser principal) {
        return new ApiResponse(true, userService.deactivateOwnAccount(SecurityUtils.requireUser(principal)));
    }

    @PatchMapping("/me/reactivate")
    public AuthDtos.ProfileResponse reactivateOwnAccount(@AuthenticationPrincipal AuthenticatedUser principal) {
        return userService.reactivateOwnAccount(SecurityUtils.requireUser(principal));
    }

    @DeleteMapping("/me")
    public ApiResponse deleteOwnAccount(@AuthenticationPrincipal AuthenticatedUser principal) {
        return new ApiResponse(true, userService.deleteOwnAccount(SecurityUtils.requireUser(principal)));
    }
}
