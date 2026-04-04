package com.linklite.backend.security;

import com.linklite.backend.entity.Account;
import com.linklite.backend.repository.AccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AccountRepository accountRepository;

    public JwtAuthenticationFilter(JwtService jwtService, AccountRepository accountRepository) {
        this.jwtService = jwtService;
        this.accountRepository = accountRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || authHeader.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
        try {
            Long accountId = jwtService.extractAccountId(token);
            Account account = accountRepository.findById(accountId).orElse(null);
            if (account != null) {
                AuthenticatedUser principal = new AuthenticatedUser(account);
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, java.util.List.of());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ignored) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}
