package com.linklite.backend.repository;

import com.linklite.backend.entity.Link;
import com.linklite.backend.entity.LinkVisit;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LinkVisitRepository extends JpaRepository<LinkVisit, Long> {
    List<LinkVisit> findByLinkOrderByVisitedAtDesc(Link link);
    long countByLink(Link link);
    LinkVisit findTopByLinkOrderByVisitedAtDesc(Link link);
}
