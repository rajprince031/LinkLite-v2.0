package com.linklite.backend.service;

import java.util.Map;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class GeoLocationService {

    private final RestTemplate restTemplate;

    public GeoLocationService(RestTemplateBuilder builder) {
        this.restTemplate = builder.build();
    }

    public Map<String, String> resolve(String ipAddress) {
        try {
            ResponseEntity<Map> response =
                restTemplate.getForEntity("http://ip-api.com/json/" + ipAddress + "?fields=status,country,regionName,city", Map.class);
            Map<String, Object> payload = response.getBody();
            if (payload == null || !"success".equals(payload.get("status"))) {
                return Map.of("country", "Unknown", "region", "Unknown", "city", "Unknown");
            }
            return Map.of(
                "country", String.valueOf(payload.getOrDefault("country", "Unknown")),
                "region", String.valueOf(payload.getOrDefault("regionName", "Unknown")),
                "city", String.valueOf(payload.getOrDefault("city", "Unknown"))
            );
        } catch (Exception ignored) {
            return Map.of("country", "Unknown", "region", "Unknown", "city", "Unknown");
        }
    }
}
