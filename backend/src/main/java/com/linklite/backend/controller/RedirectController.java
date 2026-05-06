package com.linklite.backend.controller;

import com.linklite.backend.service.LinkService;
import com.linklite.backend.util.AppException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ll")
public class RedirectController {

    private final LinkService linkService;
    private final String frontendUrl;

    public RedirectController(LinkService linkService, @Value("${app.frontend-url}") String frontendUrl) {
        this.linkService = linkService;
        this.frontendUrl = frontendUrl;
    }

    @GetMapping("/{code}")
    public ResponseEntity<Void> redirect(@PathVariable String code, HttpServletRequest request) {
        try {
            return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, linkService.resolveAndTrack(code, request))
                .build();
        } catch (AppException exception) {
            return ResponseEntity.status(302)
                .header(HttpHeaders.LOCATION, resolveFallbackLocation(code, exception))
                .build();
        }
    }

    private String resolveFallbackLocation(String code, AppException exception) {
        String type = switch (exception.getStatus().value()) {
            case 403 -> "blocked";
            case 404 -> "not-found";
            case 400 -> "broken";
            case 410 -> exception.getMessage() != null && exception.getMessage().toLowerCase().contains("expired") ? "expired" : "inactive";
            default -> "not-found";
        };

        return UriComponentsBuilder.fromHttpUrl(frontendUrl)
            .path("/link-unavailable")
            .queryParam("type", type)
            .queryParam("code", code)
            .build()
            .toUriString();
    }
}
