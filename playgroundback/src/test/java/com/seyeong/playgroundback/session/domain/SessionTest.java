package com.seyeong.playgroundback.session.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SessionTest {

    private static final Instant ISSUED_AT = Instant.parse("2026-09-25T10:00:00Z");
    private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(60);
    private static final Duration HEARTBEAT_TIMEOUT = Duration.ofSeconds(90);

    @Test
    @DisplayName("지원하지 않는 아바타로는 세션을 만들 수 없다")
    void createWithUnsupportedAvatar() {
        assertThatThrownBy(() -> new Session(1L, "s_key", "두더지4821", "🍕", ISSUED_AT))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(CommonErrorCode.VALIDATION_ERROR);
    }

    @Test
    @DisplayName("이름 앞뒤 공백은 지운다")
    void createStripsNickname() {
        Session session = new Session(1L, "s_key", "  두더지4821 ", "⛏", ISSUED_AT);

        assertThat(session.getNickname()).isEqualTo("두더지4821");
    }

    @Test
    @DisplayName("프로필은 보낸 필드만 바뀐다")
    void updateOnlyGivenFields() {
        // given
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", ISSUED_AT);

        // when
        session.updateProfile("곡괭이1007", null);

        // then
        assertThat(session.getNickname()).isEqualTo("곡괭이1007");
        assertThat(session.getAvatar()).isEqualTo("⛏");
    }

    @Test
    @DisplayName("지원하지 않는 아바타로 바꾸면 거절하고 기존 값을 유지한다")
    void updateWithUnsupportedAvatar() {
        // given
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", ISSUED_AT);

        // when & then
        assertThatThrownBy(() -> session.updateProfile("곡괭이1007", "🍕"))
                .isInstanceOf(BusinessException.class);
        assertThat(session.getNickname()).isEqualTo("두더지4821");
        assertThat(session.getAvatar()).isEqualTo("⛏");
    }

    @Test
    @DisplayName("소켓을 연결하지 않은 채 연결 제한 시간이 지나면 만료된다")
    void expiresWhenSocketNeverConnected() {
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", ISSUED_AT);

        assertThat(session.isExpired(ISSUED_AT.plusSeconds(60), CONNECT_TIMEOUT, HEARTBEAT_TIMEOUT)).isFalse();
        assertThat(session.isExpired(ISSUED_AT.plusSeconds(61), CONNECT_TIMEOUT, HEARTBEAT_TIMEOUT)).isTrue();
    }

    @Test
    @DisplayName("소켓이 붙은 세션은 마지막 신호로부터 90초가 지나야 만료된다")
    void expiresWhenHeartbeatStops() {
        // given
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", ISSUED_AT);
        session.connectSocket(ISSUED_AT.plusSeconds(1));
        session.touch(ISSUED_AT.plusSeconds(100));

        // when & then
        assertThat(session.isExpired(ISSUED_AT.plusSeconds(190), CONNECT_TIMEOUT, HEARTBEAT_TIMEOUT)).isFalse();
        assertThat(session.isExpired(ISSUED_AT.plusSeconds(191), CONNECT_TIMEOUT, HEARTBEAT_TIMEOUT)).isTrue();
    }
}
