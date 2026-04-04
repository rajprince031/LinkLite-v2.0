package com.linklite.backend.controller;

import com.linklite.backend.dto.ApiResponse;
import com.linklite.backend.dto.FeedbackDtos;
import com.linklite.backend.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse> createFeedback(@Valid @RequestBody FeedbackDtos.FeedbackRequest request) {
        feedbackService.createFeedback(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse(true, "Feedback sent successfully"));
    }
}
