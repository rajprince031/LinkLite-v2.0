package com.linklite.backend.repository;

import com.linklite.backend.entity.Account;
import com.linklite.backend.entity.Link;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LinkRepository extends JpaRepository<Link, Long> {
    List<Link> findByCreatorOrderByCreatedAtDesc(Account creator);
    void deleteByCreator(Account creator);
    Optional<Link> findByShortCode(String shortCode);
    Optional<Link> findByCustomAlias(String customAlias);
    boolean existsByShortCode(String shortCode);
    boolean existsByCustomAlias(String customAlias);
    long countByCreator(Account creator);
    @Query("select l from Link l where l.expiresAt is not null and l.expiresAt <= ?1 and l.expirationAlertSent = false")
    List<Link> findLinksRequiringExpirationAlert(Instant threshold);
}
