package com.linklite.backend.security;

import com.linklite.backend.entity.Account;
import com.linklite.backend.enums.AccountRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt-secret}") String secret, @Value("${app.jwt-expiration-ms}") long expirationMs) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Account account) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(String.valueOf(account.getId()))
            .claim("role", account.getRole().name())
            .claim("email", account.getEmail())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusMillis(expirationMs)))
            .signWith(secretKey)
            .compact();
    }

    public Long extractAccountId(String token) {
        return Long.parseLong(parseClaims(token).getSubject());
    }

    public AccountRole extractRole(String token) {
        return AccountRole.valueOf(parseClaims(token).get("role", String.class));
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
