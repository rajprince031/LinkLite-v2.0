package com.linklite.backend.security;

import com.linklite.backend.entity.Account;

public record AuthenticatedUser(Account account) {
}
