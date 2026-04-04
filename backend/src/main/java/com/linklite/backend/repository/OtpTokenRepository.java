package com.linklite.backend.repository;

import com.linklite.backend.entity.Account;
import com.linklite.backend.entity.OtpToken;
import com.linklite.backend.enums.OtpPurpose;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findTopByAccountAndPurposeAndUsedAtIsNullOrderByIdDesc(Account account, OtpPurpose purpose);
    void deleteByAccount(Account account);
}
