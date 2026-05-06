package com.linklite.backend.service;

import com.linklite.backend.dto.AuthDtos;
import com.linklite.backend.entity.Account;
import com.linklite.backend.enums.AccountRole;
import com.linklite.backend.enums.AccountStatus;
import com.linklite.backend.enums.OtpPurpose;
import com.linklite.backend.entity.Link;
import com.linklite.backend.repository.AccountRepository;
import com.linklite.backend.repository.LinkRepository;
import com.linklite.backend.security.JwtService;
import com.linklite.backend.util.AppException;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final LinkRepository linkRepository;

    public AuthService(
        AccountRepository accountRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        OtpService otpService,
        LinkRepository linkRepository
    ) {
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.linkRepository = linkRepository;
    }

    @Transactional
    public String register(AuthDtos.RegisterRequest request) {
        Account existingAccount = accountRepository.findByEmail(request.email().trim().toLowerCase()).orElse(null);
        if (existingAccount != null) {
            if (!existingAccount.isEmailVerified() && existingAccount.getStatus() == AccountStatus.PENDING_VERIFICATION) {
                existingAccount.setFirstName(request.firstName().trim());
                existingAccount.setLastName(request.lastName() == null || request.lastName().isBlank() ? "" : request.lastName().trim());
                existingAccount.setPasswordHash(passwordEncoder.encode(request.password()));
                existingAccount.setStatus(AccountStatus.PENDING_VERIFICATION);
                existingAccount.setEmailVerified(false);
                existingAccount.setDeleteRequestedAt(null);
                accountRepository.save(existingAccount);
                otpService.sendSignupOtp(existingAccount);
                return "Signup successful. OTP sent to your email.";
            }

            throw new AppException(HttpStatus.CONFLICT, "Email is already registered");
        }

        Account account = new Account();
        account.setFirstName(request.firstName().trim());
        account.setLastName(request.lastName() == null || request.lastName().isBlank() ? "" : request.lastName().trim());
        account.setEmail(request.email());
        account.setPasswordHash(passwordEncoder.encode(request.password()));
        account.setRole(AccountRole.USER);
        account.setStatus(AccountStatus.PENDING_VERIFICATION);
        account.setEmailVerified(false);
        accountRepository.save(account);
        otpService.sendSignupOtp(account);
        return "Signup successful. OTP sent to your email.";
    }

    @Transactional
    public String verifyOtp(AuthDtos.VerifyOtpRequest request) {
        Account account = accountRepository.findByEmail(request.email().trim().toLowerCase())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        otpService.verifySignupOtp(account, request.otp());
        account.setEmailVerified(true);
        account.setStatus(AccountStatus.ACTIVE);
        return "Email verified successfully";
    }

    @Transactional
    public String resendOtp(String email) {
        Account account = accountRepository.findByEmail(email.trim().toLowerCase())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "User not found"));
        if (account.isEmailVerified() || account.getStatus() != AccountStatus.PENDING_VERIFICATION) {
            throw new AppException(HttpStatus.BAD_REQUEST, "This account is already verified");
        }
        otpService.sendSignupOtp(account);
        return "A new OTP has been sent";
    }

    @Transactional
    public String forgotPassword(AuthDtos.ForgotPasswordRequest request) {
        Account account = accountRepository.findByEmail(request.email().trim().toLowerCase())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Account not found"));
        otpService.sendPasswordResetOtp(account);
        return "Password reset OTP sent";
    }

    @Transactional
    public String resetPassword(AuthDtos.ResetPasswordRequest request) {
        Account account = accountRepository.findByEmail(request.email().trim().toLowerCase())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Account not found"));
        otpService.verifyOtp(account, request.otp(), OtpPurpose.PASSWORD_RESET);
        account.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        return "Password reset successfully";
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request, AccountRole role) {
        Account account = accountRepository.findByEmail(request.email().trim().toLowerCase())
            .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Account not found"));

        if (account.getRole() != role) {
            throw new AppException(HttpStatus.FORBIDDEN, role == AccountRole.ADMIN ? "Admin access only" : "User access only");
        }
        if (!passwordEncoder.matches(request.password(), account.getPasswordHash())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Incorrect password");
        }
        if (!account.isEmailVerified() && account.getRole() == AccountRole.USER) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Please verify your email before login");
        }
        if (account.getStatus() == AccountStatus.BLOCKED) {
            throw new AppException(HttpStatus.FORBIDDEN, "Your account is blocked");
        }
        if (account.getStatus() == AccountStatus.DELETION_PENDING) {
            account.setStatus(AccountStatus.ACTIVE);
            account.setDeleteRequestedAt(null);
            restoreLinks(account);
        }
        account.setLastLoginAt(Instant.now());
        String token = jwtService.generateToken(account);
        return new AuthDtos.AuthResponse(token, toProfile(account));
    }

    private void restoreLinks(Account account) {
        for (Link link : linkRepository.findByCreatorOrderByCreatedAtDesc(account)) {
            if (link.getActiveBeforeAccountPause() != null) {
                link.setActive(Boolean.TRUE.equals(link.getActiveBeforeAccountPause()));
                link.setActiveBeforeAccountPause(null);
            }
        }
    }

    public AuthDtos.ProfileResponse toProfile(Account account) {
        return new AuthDtos.ProfileResponse(
            account.getId(),
            account.getFirstName(),
            account.getLastName(),
            account.getEmail(),
            account.getRole(),
            account.getStatus(),
            account.isEmailVerified(),
            account.getCreatedAt()
        );
    }
}
