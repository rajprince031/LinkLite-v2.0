package com.linklite.backend.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "links")
public class Link {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 60)
    private String title;

    @Column(nullable = false, length = 2048)
    private String targetUrl;

    @Column(nullable = false, unique = true)
    private String shortCode;

    @Column(unique = true, length = 24)
    private String customAlias;

    @Column(nullable = false)
    private boolean active = true;

    private Boolean activeBeforeAccountPause;

    private Instant expiresAt;

    @Column(nullable = false)
    private boolean expirationAlertSent;

    @Column(nullable = false)
    private Long clickCount = 0L;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id")
    private Account creator;

    @OneToMany(mappedBy = "link", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LinkVisit> visits = new ArrayList<>();

    @OneToMany(mappedBy = "link", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BlockedIp> blockedIps = new ArrayList<>();

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getTargetUrl() {
        return targetUrl;
    }

    public void setTargetUrl(String targetUrl) {
        this.targetUrl = targetUrl;
    }

    public String getShortCode() {
        return shortCode;
    }

    public void setShortCode(String shortCode) {
        this.shortCode = shortCode;
    }

    public String getCustomAlias() {
        return customAlias;
    }

    public void setCustomAlias(String customAlias) {
        this.customAlias = customAlias;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Boolean getActiveBeforeAccountPause() {
        return activeBeforeAccountPause;
    }

    public void setActiveBeforeAccountPause(Boolean activeBeforeAccountPause) {
        this.activeBeforeAccountPause = activeBeforeAccountPause;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isExpirationAlertSent() {
        return expirationAlertSent;
    }

    public void setExpirationAlertSent(boolean expirationAlertSent) {
        this.expirationAlertSent = expirationAlertSent;
    }

    public Long getClickCount() {
        return clickCount;
    }

    public void setClickCount(Long clickCount) {
        this.clickCount = clickCount;
    }

    public Account getCreator() {
        return creator;
    }

    public void setCreator(Account creator) {
        this.creator = creator;
    }

    public List<LinkVisit> getVisits() {
        return visits;
    }

    public List<BlockedIp> getBlockedIps() {
        return blockedIps;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
