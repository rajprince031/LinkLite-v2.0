package com.linklite.backend.repository;

import com.linklite.backend.entity.BlockedIp;
import com.linklite.backend.entity.Link;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockedIpRepository extends JpaRepository<BlockedIp, Long> {
    List<BlockedIp> findByLinkOrderByCreatedAtDesc(Link link);
    Optional<BlockedIp> findByLinkAndIpAddress(Link link, String ipAddress);
    long countByLink(Link link);
}
