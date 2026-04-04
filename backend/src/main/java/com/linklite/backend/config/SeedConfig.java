package com.linklite.backend.config;

import com.linklite.backend.entity.Account;
import com.linklite.backend.entity.Link;
import com.linklite.backend.entity.LinkVisit;
import com.linklite.backend.enums.AccountRole;
import com.linklite.backend.enums.AccountStatus;
import com.linklite.backend.repository.AccountRepository;
import com.linklite.backend.repository.LinkRepository;
import com.linklite.backend.repository.LinkVisitRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class SeedConfig {

    private static final Logger logger = LoggerFactory.getLogger(SeedConfig.class);

    @Bean
    CommandLineRunner createDefaultAdmin(
        AccountRepository accountRepository,
        LinkRepository linkRepository,
        LinkVisitRepository linkVisitRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.admin.email}") String adminEmail,
        @Value("${app.admin.password}") String adminPassword,
        @Value("${app.admin.first-name}") String firstName,
        @Value("${app.admin.last-name}") String lastName,
        @Value("${app.seed-demo-data}") boolean seedDemoData
    ) {
        return args -> {
            if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
                logger.warn("Admin seed skipped because ADMIN_EMAIL or ADMIN_PASSWORD is not configured.");
                return;
            }

            if (accountRepository.findByEmail(adminEmail.toLowerCase()).isPresent()) {
                logger.info("Default admin is ready. Email: {}", adminEmail);
            } else {
                Account account = new Account();
                account.setFirstName(firstName);
                account.setLastName(lastName);
                account.setEmail(adminEmail);
                account.setPasswordHash(passwordEncoder.encode(adminPassword));
                account.setRole(AccountRole.ADMIN);
                account.setStatus(AccountStatus.ACTIVE);
                account.setEmailVerified(true);
                accountRepository.save(account);
                logger.info("Created default admin for local run. Email: {} Password: {}", adminEmail, adminPassword);
            }

            if (!seedDemoData) {
                return;
            }

            long userCount = accountRepository.findByRoleOrderByCreatedAtDesc(AccountRole.USER).size();
            if (userCount > 0 || linkRepository.count() > 0) {
                logger.info("Skipping demo data seed because real user/link data already exists.");
                return;
            }

            Account userOne = createDemoUser(accountRepository, passwordEncoder, "Prince", "Raj", "prince@example.com");
            Account userTwo = createDemoUser(accountRepository, passwordEncoder, "Aarav", "Sharma", "aarav@example.com");

            Link linkOne = createDemoLink(linkRepository, userOne, "Portfolio Link", "https://portfolio.example.com", "prince-portfolio", true, 18);
            Link linkTwo = createDemoLink(linkRepository, userOne, "Resume Link", "https://resume.example.com", "prince-resume", true, 8);
            Link linkThree = createDemoLink(linkRepository, userTwo, "Store Offer", "https://store.example.com/offer", "store-offer", false, 12);

            seedVisit(linkVisitRepository, linkOne, "49.37.12.20", "India", "Punjab", "Ludhiana", "Chrome", "Windows", "Desktop", 7);
            seedVisit(linkVisitRepository, linkOne, "152.58.33.91", "India", "Delhi", "New Delhi", "Safari", "iOS", "Mobile", 5);
            seedVisit(linkVisitRepository, linkTwo, "103.45.67.89", "India", "Maharashtra", "Mumbai", "Firefox", "Linux", "Desktop", 3);
            seedVisit(linkVisitRepository, linkThree, "84.201.10.15", "Germany", "Berlin", "Berlin", "Edge", "Windows", "Desktop", 10);

            logger.info("Seeded demo users, links, and analytics for local admin testing.");
        };
    }

    private Account createDemoUser(AccountRepository accountRepository, PasswordEncoder passwordEncoder, String firstName, String lastName, String email) {
        Account account = new Account();
        account.setFirstName(firstName);
        account.setLastName(lastName);
        account.setEmail(email);
        account.setPasswordHash(passwordEncoder.encode("User@12345"));
        account.setRole(AccountRole.USER);
        account.setStatus(AccountStatus.ACTIVE);
        account.setEmailVerified(true);
        account.setLastLoginAt(Instant.now().minus(2, ChronoUnit.HOURS));
        return accountRepository.save(account);
    }

    private Link createDemoLink(
        LinkRepository linkRepository,
        Account creator,
        String title,
        String targetUrl,
        String customAlias,
        boolean active,
        long clickCount
    ) {
        Link link = new Link();
        link.setCreator(creator);
        link.setTitle(title);
        link.setTargetUrl(targetUrl);
        link.setShortCode(customAlias + "-id");
        link.setCustomAlias(customAlias);
        link.setActive(active);
        link.setClickCount(clickCount);
        link.setExpiresAt(Instant.now().plus(10, ChronoUnit.DAYS));
        return linkRepository.save(link);
    }

    private void seedVisit(
        LinkVisitRepository linkVisitRepository,
        Link link,
        String ip,
        String country,
        String region,
        String city,
        String browser,
        String os,
        String deviceType,
        long hoursAgo
    ) {
        LinkVisit visit = new LinkVisit();
        visit.setLink(link);
        visit.setIpAddress(ip);
        visit.setCountry(country);
        visit.setRegion(region);
        visit.setCity(city);
        visit.setBrowser(browser);
        visit.setOs(os);
        visit.setDeviceType(deviceType);
        visit.setUserAgent(browser + " / " + os);
        visit.setReferrer("https://google.com");
        visit.setBlocked(false);
        linkVisitRepository.save(visit);
    }
}
