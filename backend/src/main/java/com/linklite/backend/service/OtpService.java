package com.linklite.backend.service;

import com.linklite.backend.entity.Account;
import com.linklite.backend.entity.OtpToken;
import com.linklite.backend.enums.OtpPurpose;
import com.linklite.backend.repository.OtpTokenRepository;
import com.linklite.backend.util.AppException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;
    private final long otpExpirationMinutes;
    private final boolean devPrintOtp;
    private final Random random = new Random();

    public OtpService(
        OtpTokenRepository otpTokenRepository,
        EmailService emailService,
        @Value("${app.otp-expiration-minutes}") long otpExpirationMinutes,
        @Value("${app.dev-print-otp}") boolean devPrintOtp
    ) {
        this.otpTokenRepository = otpTokenRepository;
        this.emailService = emailService;
        this.otpExpirationMinutes = otpExpirationMinutes;
        this.devPrintOtp = devPrintOtp;
    }

    @Transactional
    public void sendSignupOtp(Account account) {
        sendOtp(account, account.getEmail(), OtpPurpose.SIGNUP_VERIFICATION, "LinkLite OTP Verification");
    }

    @Transactional
    public void sendPasswordResetOtp(Account account) {
        sendOtp(account, account.getEmail(), OtpPurpose.PASSWORD_RESET, "LinkLite Password Reset OTP");
    }

    @Transactional
    public void sendOtp(Account account, String destinationEmail, OtpPurpose purpose, String subject) {
        OtpToken token = new OtpToken();
        token.setAccount(account);
        token.setPurpose(purpose);
        token.setCode(String.format("%06d", random.nextInt(1_000_000)));
        token.setExpiresAt(Instant.now().plus(otpExpirationMinutes, ChronoUnit.MINUTES));
        otpTokenRepository.save(token);
        if (devPrintOtp) {
            logger.info("DEV OTP for {} => {}", destinationEmail, token.getCode());
        }
        String greetingName = account.getFirstName() == null || account.getFirstName().isBlank()
            ? "there"
            : account.getFirstName().trim();
        String actionLabel = purpose == OtpPurpose.PASSWORD_RESET ? "reset your password" : "verify your email";
        String plainBody =
            "Hello " + greetingName + ",\n\n"
                + "We received a request to " + actionLabel + " for your LinkLite account.\n\n"
                + "Your one-time verification code is: " + token.getCode() + "\n\n"
                + "This code will expire in " + otpExpirationMinutes + " minutes.\n\n"
                + "If you did not request this, you can safely ignore this email.\n\n"
                + "Regards,\n"
                + "LinkLite Team";
        String htmlBody =
            "<div style=\"margin:0;padding:24px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;\">"
                + "<div style=\"max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:18px;overflow:hidden;\">"
                + "<div style=\"padding:18px 24px;background:linear-gradient(135deg,#2563eb,#4f8ffb);color:#ffffff;\">"
                + "<div style=\"font-size:22px;font-weight:700;letter-spacing:0.2px;\">LinkLite</div>"
                + "<div style=\"margin-top:6px;font-size:13px;opacity:0.92;\">Secure account verification</div>"
                + "</div>"
                + "<div style=\"padding:24px;\">"
                + "<p style=\"margin:0 0 12px;font-size:15px;\">Hello <strong>" + escapeHtml(greetingName) + "</strong>,</p>"
                + "<p style=\"margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;\">"
                + "We received a request to <strong>" + escapeHtml(actionLabel) + "</strong> for your LinkLite account."
                + "</p>"
                + "<div style=\"margin:22px 0;padding:18px;border:1px solid #dbeafe;border-radius:16px;background:#f8fbff;text-align:center;\">"
                + "<div style=\"font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;\">Your OTP Code</div>"
                + "<div style=\"font-size:34px;font-weight:800;letter-spacing:0.22em;color:#1d4ed8;\">" + token.getCode() + "</div>"
                + "<div style=\"margin-top:10px;font-size:13px;color:#64748b;\">Valid for " + otpExpirationMinutes + " minutes</div>"
                + "</div>"
                + "<p style=\"margin:0 0 12px;font-size:14px;line-height:1.7;color:#475569;\">"
                + "Enter this code in the LinkLite app to continue. For your security, do not share this code with anyone."
                + "</p>"
                + "<p style=\"margin:0 0 18px;font-size:14px;line-height:1.7;color:#475569;\">"
                + "If you did not request this action, you can safely ignore this email."
                + "</p>"
                + "<div style=\"padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;\">"
                + "Regards,<br><strong style=\"color:#1f2937;\">LinkLite Team</strong>"
                + "</div>"
                + "</div>"
                + "</div>"
                + "</div>";
        emailService.sendHtmlEmailOrThrow(destinationEmail, subject, plainBody, htmlBody);
    }

    @Transactional
    public void verifySignupOtp(Account account, String otp) {
        verifyOtp(account, otp, OtpPurpose.SIGNUP_VERIFICATION);
    }

    @Transactional
    public void verifyOtp(Account account, String otp, OtpPurpose purpose) {
        OtpToken token = otpTokenRepository
            .findTopByAccountAndPurposeAndUsedAtIsNullOrderByIdDesc(account, purpose)
            .orElseThrow(() -> new AppException(HttpStatus.BAD_REQUEST, "OTP not found"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "OTP expired");
        }
        if (!token.getCode().equals(otp)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
        token.setUsedAt(Instant.now());
    }

    private String escapeHtml(String value) {
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&#39;");
    }
}
