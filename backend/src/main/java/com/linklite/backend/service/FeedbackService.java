package com.linklite.backend.service;

import com.linklite.backend.dto.FeedbackDtos;
import com.linklite.backend.entity.FeedbackMessage;
import com.linklite.backend.repository.FeedbackMessageRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    private final FeedbackMessageRepository feedbackMessageRepository;

    public FeedbackService(FeedbackMessageRepository feedbackMessageRepository) {
        this.feedbackMessageRepository = feedbackMessageRepository;
    }

    @Transactional
    public FeedbackDtos.FeedbackResponse createFeedback(FeedbackDtos.FeedbackRequest request) {
        FeedbackMessage feedbackMessage = new FeedbackMessage();
        feedbackMessage.setName(request.name().trim());
        feedbackMessage.setEmail(request.email());
        feedbackMessage.setMessage(request.message().trim());
        return toResponse(feedbackMessageRepository.save(feedbackMessage));
    }

    @Transactional(readOnly = true)
    public List<FeedbackDtos.FeedbackResponse> getRecentFeedback() {
        return feedbackMessageRepository.findTop10ByOrderByCreatedAtDesc().stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public long getTotalFeedbackCount() {
        return feedbackMessageRepository.count();
    }

    private FeedbackDtos.FeedbackResponse toResponse(FeedbackMessage feedbackMessage) {
        return new FeedbackDtos.FeedbackResponse(
            feedbackMessage.getId(),
            feedbackMessage.getName(),
            feedbackMessage.getEmail(),
            feedbackMessage.getMessage(),
            feedbackMessage.getCreatedAt()
        );
    }
}
