package com.linklite.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.linklite.backend.util.AppException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String apiUrl;
    private final String apiKey;
    private final String fromAddress;
    private final String fromName;
    private final long requestTimeoutMs;

    public EmailService(
        ObjectMapper objectMapper,
        @Value("${app.mail.api-url}") String apiUrl,
        @Value("${app.mail.api-key:}") String apiKey,
        @Value("${app.mail.from-address:}") String fromAddress,
        @Value("${app.mail.from-name:LinkLite}") String fromName,
        @Value("${app.mail.request-timeout-ms:5000}") long requestTimeoutMs
    ) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(requestTimeoutMs))
            .build();
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.requestTimeoutMs = requestTimeoutMs;
    }

    public void sendHtmlEmailOrThrow(String to, String subject, String plainBody, String htmlBody) {
        if (apiKey == null || apiKey.isBlank() || fromAddress == null || fromAddress.isBlank()) {
            throw new AppException(HttpStatus.SERVICE_UNAVAILABLE, "Email service is not configured right now");
        }

        try {
            sendTransactionalEmail(to, subject, plainBody, htmlBody, true);
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            logger.error("Unable to send OTP email to {} with subject '{}': {}", to, subject, exception.getMessage());
            throw new AppException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "We could not send the OTP email right now. Please try again in a moment."
            );
        }
    }

    @Async("mailTaskExecutor")
    public void sendEmail(String to, String subject, String body) {
        if (apiKey == null || apiKey.isBlank() || fromAddress == null || fromAddress.isBlank()) {
            logger.info("MAIL_API_KEY or MAIL_FROM is not configured. Skipping email to {} with subject '{}'.", to, subject);
            return;
        }

        try {
            sendTransactionalEmail(to, subject, body, null, false);
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            logger.error("Unable to send plain email to {} with subject '{}': {}", to, subject, exception.getMessage());
        }
    }

    @Async("mailTaskExecutor")
    public void sendHtmlEmail(String to, String subject, String plainBody, String htmlBody) {
        if (apiKey == null || apiKey.isBlank() || fromAddress == null || fromAddress.isBlank()) {
            logger.info("MAIL_API_KEY or MAIL_FROM is not configured. Skipping email to {} with subject '{}'.", to, subject);
            return;
        }

        try {
            sendTransactionalEmail(to, subject, plainBody, htmlBody, false);
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            logger.error("Unable to send HTML email to {} with subject '{}': {}", to, subject, exception.getMessage());
        }
    }

    private void sendTransactionalEmail(String to, String subject, String plainBody, String htmlBody, boolean throwOnFailure)
        throws IOException, InterruptedException {
        String payload = buildPayload(to, subject, plainBody, htmlBody);
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .timeout(Duration.ofMillis(requestTimeoutMs))
            .header("accept", "application/json")
            .header("content-type", "application/json")
            .header("api-key", apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(payload))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();

        if (status < 200 || status >= 300) {
            logger.error("Brevo email API rejected request with status {} and body {}", status, response.body());
            if (throwOnFailure) {
                throw new AppException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "We could not send the OTP email right now. Please try again in a moment."
                );
            }
        }
    }

    private String buildPayload(String to, String subject, String plainBody, String htmlBody) throws JsonProcessingException {
        Map<String, Object> payload = Map.of(
            "sender", Map.of(
                "name", fromName,
                "email", fromAddress
            ),
            "to", List.of(Map.of("email", to)),
            "subject", subject,
            "textContent", plainBody,
            "htmlContent", htmlBody == null || htmlBody.isBlank() ? plainBody.replace("\n", "<br/>") : htmlBody
        );

        return objectMapper.writeValueAsString(payload);
    }
}
