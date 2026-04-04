package com.linklite.backend.repository;

import com.linklite.backend.entity.FeedbackMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeedbackMessageRepository extends JpaRepository<FeedbackMessage, Long> {

    List<FeedbackMessage> findTop10ByOrderByCreatedAtDesc();
}
