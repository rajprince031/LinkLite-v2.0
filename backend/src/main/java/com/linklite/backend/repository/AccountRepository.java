package com.linklite.backend.repository;

import com.linklite.backend.entity.Account;
import com.linklite.backend.enums.AccountRole;
import com.linklite.backend.enums.AccountStatus;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByEmail(String email);
    List<Account> findByRoleOrderByCreatedAtDesc(AccountRole role);
    List<Account> findByStatusAndDeleteRequestedAtBefore(AccountStatus status, Instant deleteRequestedAt);
}
