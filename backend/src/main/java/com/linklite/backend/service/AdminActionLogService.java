package com.linklite.backend.service;

import com.linklite.backend.entity.Account;
import com.linklite.backend.entity.AdminActionLog;
import com.linklite.backend.repository.AdminActionLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AdminActionLogService {

    private final AdminActionLogRepository adminActionLogRepository;

    public AdminActionLogService(AdminActionLogRepository adminActionLogRepository) {
        this.adminActionLogRepository = adminActionLogRepository;
    }

    public void log(Account admin, String actionType, String targetType, Long targetId, String targetLabel) {
        AdminActionLog log = new AdminActionLog();
        log.setActionType(actionType);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setTargetLabel(targetLabel);
        log.setPerformedBy(admin.getEmail());
        adminActionLogRepository.save(log);
    }
}
