package com.seyeong.playgroundback.plaza.dto;

import java.time.Instant;

/** 10분 경계 (P-23). 목록을 비우고 안내 한 줄을 남긴다. */
public record PlazaChatResetResponse(Instant at) {
}
