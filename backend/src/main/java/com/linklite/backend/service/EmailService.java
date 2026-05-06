package com.linklite.backend.service;

import com.linklite.backend.util.AppException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    public void sendHtmlEmailOrThrow(String to, String subject, String plainBody, String htmlBody) {
        if (fromAddress == null || fromAddress.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Email service is not configured right now");
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setFrom(fromAddress);
            helper.setSubject(subject);
            helper.setText(plainBody, htmlBody);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            logger.error("Unable to send OTP email to {} with subject '{}': {}", to, subject, exception.getMessage());
            throw new AppException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "We could not send the OTP email right now. Please try again in a moment."
            );
        }
    }

    @Async("mailTaskExecutor")
    public void sendEmail(String to, String subject, String body) {
        if (fromAddress == null || fromAddress.isBlank()) {
            logger.info("MAIL_USERNAME is not configured. Skipping email to {} with subject '{}'.", to, subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setFrom(fromAddress);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (MailException exception) {
            logger.error("Unable to send plain email to {} with subject '{}': {}", to, subject, exception.getMessage());
        }
    }

    @Async("mailTaskExecutor")
    public void sendHtmlEmail(String to, String subject, String plainBody, String htmlBody) {
        if (fromAddress == null || fromAddress.isBlank()) {
            logger.info("MAIL_USERNAME is not configured. Skipping email to {} with subject '{}'.", to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setFrom(fromAddress);
            helper.setSubject(subject);
            helper.setText(plainBody, htmlBody);
            mailSender.send(message);
        } catch (MessagingException | MailException exception) {
            logger.warn("Falling back to plain email for {} because rich email failed: {}", to, exception.getMessage());
            sendEmail(to, subject, plainBody);
        }
    }
}
