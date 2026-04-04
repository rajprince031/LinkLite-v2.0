package com.linklite.backend.service;

import com.linklite.backend.entity.Account;
import com.linklite.backend.enums.AccountStatus;
import com.linklite.backend.repository.AccountRepository;
import com.linklite.backend.repository.LinkRepository;
import com.linklite.backend.repository.OtpTokenRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AccountCleanupScheduler {

    private final AccountRepository accountRepository;
    private final LinkRepository linkRepository;
    private final OtpTokenRepository otpTokenRepository;

    public AccountCleanupScheduler(
        AccountRepository accountRepository,
        LinkRepository linkRepository,
        OtpTokenRepository otpTokenRepository
    ) {
        this.accountRepository = accountRepository;
        this.linkRepository = linkRepository;
        this.otpTokenRepository = otpTokenRepository;
    }

    @Scheduled(fixedDelay = 3600000)
    @Transactional
    public void deleteExpiredPendingAccounts() {
        Instant threshold = Instant.now().minus(7, ChronoUnit.DAYS);
        for (Account account : accountRepository.findByStatusAndDeleteRequestedAtBefore(AccountStatus.DELETION_PENDING, threshold)) {
            otpTokenRepository.deleteByAccount(account);
            linkRepository.deleteByCreator(account);
            accountRepository.delete(account);
        }
    }
}
