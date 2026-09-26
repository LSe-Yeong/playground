package com.seyeong.playgroundback.plaza.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlazaChatWindowTest {

    @Test
    @DisplayName("10분 경계는 :00 :10 … :50 에 놓인다")
    void boundariesLandOnTenMinuteMarks() {
        Instant now = Instant.parse("2026-09-25T10:17:42Z");

        assertThat(PlazaChatWindow.currentResetAt(now)).isEqualTo(Instant.parse("2026-09-25T10:10:00Z"));
        assertThat(PlazaChatWindow.nextResetAt(now)).isEqualTo(Instant.parse("2026-09-25T10:20:00Z"));
    }

    @Test
    @DisplayName("경계에 정확히 선 순간은 그 경계가 지금 구간의 시작이다")
    void exactBoundaryStartsTheWindow() {
        Instant now = Instant.parse("2026-09-25T10:20:00Z");

        assertThat(PlazaChatWindow.currentResetAt(now)).isEqualTo(now);
        assertThat(PlazaChatWindow.nextResetAt(now)).isEqualTo(Instant.parse("2026-09-25T10:30:00Z"));
    }

    @Test
    @DisplayName("정시 직전 구간의 다음 경계는 다음 시각의 정각이다")
    void lastWindowOfTheHourRollsOver() {
        Instant now = Instant.parse("2026-09-25T10:59:59Z");

        assertThat(PlazaChatWindow.nextResetAt(now)).isEqualTo(Instant.parse("2026-09-25T11:00:00Z"));
    }
}
