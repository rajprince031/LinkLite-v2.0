package com.linklite.backend.service;

import com.linklite.backend.entity.Link;
import com.linklite.backend.repository.LinkRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class AlertScheduler {

    private final LinkRepository linkRepository;
    private final EmailService emailService;

    public AlertScheduler(LinkRepository linkRepository, EmailService emailService) {
        this.linkRepository = linkRepository;
        this.emailService = emailService;
    }

    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void sendExpirationAlerts() {
        Instant threshold = Instant.now().plus(24, ChronoUnit.HOURS);
        for (Link link : linkRepository.findLinksRequiringExpirationAlert(threshold)) {
            if (link.getExpiresAt() == null) {
                continue;
            }
            String greetingName = link.getCreator().getFirstName() == null || link.getCreator().getFirstName().isBlank()
                ? "there"
                : link.getCreator().getFirstName().trim();
            String plainBody =
                "Hello " + greetingName + ",\n\n"
                    + "Your LinkLite short link \"" + link.getTitle() + "\" is scheduled to expire on " + link.getExpiresAt() + ".\n\n"
                    + "Review the link in your dashboard if you want to extend or update it.\n\n"
                    + "Regards,\n"
                    + "LinkLite Team";
            String htmlBody =
                "<div style=\"margin:0;padding:24px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;\">"
                    + "<div style=\"max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:18px;overflow:hidden;\">"
                    + "<div style=\"padding:18px 24px;background:linear-gradient(135deg,#2563eb,#4f8ffb);color:#ffffff;\">"
                    + "<div style=\"font-size:22px;font-weight:700;\">LinkLite</div>"
                    + "<div style=\"margin-top:6px;font-size:13px;opacity:0.92;\">Expiry reminder</div>"
                    + "</div>"
                    + "<div style=\"padding:24px;\">"
                    + "<p style=\"margin:0 0 12px;font-size:15px;\">Hello <strong>" + escapeHtml(greetingName) + "</strong>,</p>"
                    + "<p style=\"margin:0 0 16px;font-size:14px;line-height:1.7;color:#475569;\">"
                    + "Your LinkLite short link is expiring soon. Please review it in your dashboard if you want to extend or update it."
                    + "</p>"
                    + "<div style=\"margin:20px 0;padding:18px;border:1px solid #dbeafe;border-radius:16px;background:#f8fbff;\">"
                    + "<div style=\"font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;\">Expiring Link</div>"
                    + "<div style=\"font-size:20px;font-weight:700;color:#1f2937;\">" + escapeHtml(link.getTitle()) + "</div>"
                    + "<div style=\"margin-top:8px;font-size:13px;color:#64748b;\">Expires on " + link.getExpiresAt() + "</div>"
                    + "</div>"
                    + "<div style=\"padding-top:16px;border-top:1px solid #e5e7eb;font-size:13px;color:#64748b;\">"
                    + "Regards,<br><strong style=\"color:#1f2937;\">LinkLite Team</strong>"
                    + "</div>"
                    + "</div>"
                    + "</div>"
                    + "</div>";
            emailService.sendHtmlEmail(
                link.getCreator().getEmail(),
                "LinkLite expiration alert",
                plainBody,
                htmlBody
            );
            link.setExpirationAlertSent(true);
        }
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
