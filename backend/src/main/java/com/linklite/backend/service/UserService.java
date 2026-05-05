package com.linklite.backend.service;

import com.linklite.backend.dto.AuthDtos;
import com.linklite.backend.entity.Account;
import com.linklite.backend.repository.AccountRepository;
import com.linklite.backend.repository.LinkRepository;
import com.linklite.backend.repository.OtpTokenRepository;
import com.linklite.backend.util.AppException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final LinkRepository linkRepository;
    private final OtpTokenRepository otpTokenRepository;

    public UserService(
        AccountRepository accountRepository,
        PasswordEncoder passwordEncoder,
        AuthService authService,
        LinkRepository linkRepository,
        OtpTokenRepository otpTokenRepository
    ) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.authService = authService;
        this.linkRepository = linkRepository;
        this.otpTokenRepository = otpTokenRepository;
    }

    public AuthDtos.ProfileResponse getProfile(Account account) {
        return authService.toProfile(requireManagedAccount(account));
    }

    @Transactional
    public AuthDtos.ProfileResponse updateProfile(Account account, AuthDtos.UpdateProfileRequest request) {
        Account managedAccount = requireManagedAccount(account);
        managedAccount.setFirstName(request.firstName().trim());
        managedAccount.setLastName(request.lastName() == null ? "" : request.lastName().trim());
        return authService.toProfile(managedAccount);
    }

    @Transactional
    public String changePassword(Account account, AuthDtos.ChangePasswordRequest request) {
        Account managedAccount = requireManagedAccount(account);
        if (!passwordEncoder.matches(request.currentPassword(), managedAccount.getPasswordHash())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        managedAccount.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return "Password updated successfully";
    }

    @Transactional
    public String deleteOwnAccount(Account account) {
        Account managedAccount = requireManagedAccount(account);
        pauseLinks(managedAccount);
        managedAccount.setStatus(com.linklite.backend.enums.AccountStatus.DELETION_PENDING);
        managedAccount.setDeleteRequestedAt(Instant.now());
        return "Your account is scheduled for deletion after 7 days";
    }

    @Transactional
    public String deactivateOwnAccount(Account account) {
        Account managedAccount = requireManagedAccount(account);
        pauseLinks(managedAccount);
        managedAccount.setStatus(com.linklite.backend.enums.AccountStatus.INACTIVE);
        managedAccount.setDeleteRequestedAt(null);
        return "Your account has been deactivated";
    }

    @Transactional
    public AuthDtos.ProfileResponse reactivateOwnAccount(Account account) {
        Account managedAccount = requireManagedAccount(account);
        managedAccount.setStatus(com.linklite.backend.enums.AccountStatus.ACTIVE);
        managedAccount.setDeleteRequestedAt(null);
        restoreLinks(managedAccount);
        return authService.toProfile(managedAccount);
    }

    private Account requireManagedAccount(Account account) {
        return accountRepository.findById(account.getId())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Account not found"));
    }

    private void pauseLinks(Account account) {
        for (var link : linkRepository.findByCreatorOrderByCreatedAtDesc(account)) {
            link.setActiveBeforeAccountPause(link.isActive());
            link.setActive(false);
        }
    }

    private void restoreLinks(Account account) {
        for (var link : linkRepository.findByCreatorOrderByCreatedAtDesc(account)) {
            if (link.getActiveBeforeAccountPause() != null) {
                link.setActive(Boolean.TRUE.equals(link.getActiveBeforeAccountPause()));
                link.setActiveBeforeAccountPause(null);
            }
        }
    }
}
