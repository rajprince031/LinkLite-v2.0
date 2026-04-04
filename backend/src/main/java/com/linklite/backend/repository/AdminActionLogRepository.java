package com.linklite.backend.repository;

import com.linklite.backend.entity.AdminActionLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminActionLogRepository extends JpaRepository<AdminActionLog, Long> {
    List<AdminActionLog> findTop10ByOrderByCreatedAtDesc();
}
