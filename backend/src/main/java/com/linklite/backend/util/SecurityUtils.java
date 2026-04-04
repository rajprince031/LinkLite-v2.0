package com.linklite.backend.util;

import com.linklite.backend.entity.Account;
import com.linklite.backend.enums.AccountRole;
import com.linklite.backend.security.AuthenticatedUser;
import org.springframework.http.HttpStatus;

public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static Account requireUser(AuthenticatedUser principal) {
        if (principal == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return principal.account();
    }

    public static Account requireAdmin(AuthenticatedUser principal) {
        Account account = requireUser(principal);
        if (account.getRole() != AccountRole.ADMIN) {
            throw new AppException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        return account;
    }
}
