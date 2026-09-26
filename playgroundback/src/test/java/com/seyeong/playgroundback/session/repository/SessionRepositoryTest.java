package com.seyeong.playgroundback.session.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.seyeong.playgroundback.session.domain.Session;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** 메모리 저장소라 Mock 없이 실제 객체로 검증한다. */
class SessionRepositoryTest {

    private static final Instant NOW = Instant.parse("2026-09-25T10:00:00Z");

    private final SessionRepository sessionRepository = new SessionRepository();

    @Test
    @DisplayName("저장한 세션을 세션 키로 찾는다")
    void saveAndFind() {
        // given
        Session session = sessionRepository.save(
                new Session(sessionRepository.nextId(), "s_key", "두더지4821", "⛏", NOW));

        // when & then
        assertThat(sessionRepository.findBySessionKey("s_key")).containsSame(session);
        assertThat(sessionRepository.findBySessionKey("s_other")).isEmpty();
    }

    @Test
    @DisplayName("id 는 1씩 늘어난다")
    void nextIdIncreases() {
        long first = sessionRepository.nextId();
        long second = sessionRepository.nextId();

        assertThat(second).isEqualTo(first + 1);
    }

    @Test
    @DisplayName("같은 세션을 두 번 지우면 두 번째는 false 다")
    void deleteTwice() {
        // given
        Session session = sessionRepository.save(new Session(1L, "s_key", "두더지4821", "⛏", NOW));

        // when & then
        assertThat(sessionRepository.delete(session)).isTrue();
        assertThat(sessionRepository.delete(session)).isFalse();
        assertThat(sessionRepository.findAll()).isEmpty();
    }
}
