package com.seyeong.playgroundback.session.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import com.seyeong.playgroundback.global.websocket.SocketSessionRegistry;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.domain.SessionClosedEvent;
import com.seyeong.playgroundback.session.repository.SessionRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.util.unit.DataSize;
import org.springframework.web.socket.WebSocketSession;

@ExtendWith(MockitoExtension.class)
class SessionCommandServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-25T10:10:00Z");

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private SessionKeyGenerator sessionKeyGenerator;

    @Mock
    private SocketSessionRegistry socketSessionRegistry;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private WebSocketSession socket;

    private SessionCommandService sessionCommandService;

    @BeforeEach
    void setUp() {
        PlaygroundProperties properties = new PlaygroundProperties(
                List.of("http://localhost:*"),
                new PlaygroundProperties.Session("sessionKey", true,
                        Duration.ofSeconds(60), Duration.ofSeconds(90), Duration.ofSeconds(30)),
                new PlaygroundProperties.WebSocket(Duration.ofSeconds(30), Duration.ofSeconds(10),
                        DataSize.ofKilobytes(512))
        );
        sessionCommandService = new SessionCommandService(sessionRepository, sessionKeyGenerator,
                socketSessionRegistry, eventPublisher, properties, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    @DisplayName("세션을 만들면 새 세션 키를 발급하고 저장한다")
    void createSession() {
        // given
        given(sessionRepository.nextId()).willReturn(7L);
        given(sessionKeyGenerator.generate()).willReturn("s_9f3a");
        given(sessionRepository.save(any(Session.class))).willAnswer(invocation -> invocation.getArgument(0));

        // when
        Session session = sessionCommandService.createSession("두더지4821", "⛏");

        // then
        assertThat(session.getId()).isEqualTo(7L);
        assertThat(session.getSessionKey()).isEqualTo("s_9f3a");
        assertThat(session.getIssuedAt()).isEqualTo(NOW);
        assertThat(session.isSocketConnected()).isFalse();
    }

    @Test
    @DisplayName("쿠키의 세션이 살아 있으면 새로 만들지 않고 그대로 쓴다")
    void issueSessionReusesLiving() {
        // given — 탭을 하나 더 열어 다시 호출한 상황
        Session existing = new Session(7L, "s_9f3a", "두더지4821", "⛏", NOW);
        given(sessionRepository.findBySessionKey("s_9f3a")).willReturn(Optional.of(existing));

        // when
        SessionIssue issued = sessionCommandService.issueSession("s_9f3a", "곡괭이1007", "💎");

        // then
        assertThat(issued.created()).isFalse();
        assertThat(issued.session()).isSameAs(existing);
        assertThat(issued.session().getNickname()).isEqualTo("곡괭이1007");
        assertThat(issued.session().getAvatar()).isEqualTo("💎");
        then(sessionRepository).should(never()).save(any(Session.class));
    }

    @Test
    @DisplayName("쿠키가 없으면 새 세션을 만든다")
    void issueSessionWithoutCookie() {
        // given
        given(sessionRepository.nextId()).willReturn(7L);
        given(sessionKeyGenerator.generate()).willReturn("s_new");
        given(sessionRepository.save(any(Session.class))).willAnswer(invocation -> invocation.getArgument(0));

        // when
        SessionIssue issued = sessionCommandService.issueSession(null, "두더지4821", "⛏");

        // then
        assertThat(issued.created()).isTrue();
        assertThat(issued.session().getSessionKey()).isEqualTo("s_new");
    }

    @Test
    @DisplayName("쿠키가 있어도 서버에 없는 세션이면 새로 만든다")
    void issueSessionWithDeadCookie() {
        // given — TTL 로 이미 지워졌거나 서버가 재시작된 경우
        given(sessionRepository.findBySessionKey("s_dead")).willReturn(Optional.empty());
        given(sessionRepository.nextId()).willReturn(8L);
        given(sessionKeyGenerator.generate()).willReturn("s_new");
        given(sessionRepository.save(any(Session.class))).willAnswer(invocation -> invocation.getArgument(0));

        // when
        SessionIssue issued = sessionCommandService.issueSession("s_dead", "두더지4821", "⛏");

        // then
        assertThat(issued.created()).isTrue();
        assertThat(issued.session().getSessionKey()).isEqualTo("s_new");
    }

    @Test
    @DisplayName("소켓을 붙이면 연결 상태가 되고 마지막 신호 시각이 갱신된다")
    void connectSocket() {
        // given
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", NOW.minusSeconds(5));
        given(socketSessionRegistry.register(1L, socket)).willReturn(true);

        // when
        boolean connected = sessionCommandService.connectSocket(session, socket);

        // then
        assertThat(connected).isTrue();
        assertThat(session.isSocketConnected()).isTrue();
        assertThat(session.getLastSeenAt()).isEqualTo(NOW);
    }

    @Test
    @DisplayName("이미 소켓이 붙은 세션에 또 붙이면 거절한다")
    void connectSocketTwice() {
        // given
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", NOW);
        given(socketSessionRegistry.register(1L, socket)).willReturn(false);

        // when
        boolean connected = sessionCommandService.connectSocket(session, socket);

        // then
        assertThat(connected).isFalse();
        assertThat(session.isSocketConnected()).isFalse();
    }

    @Test
    @DisplayName("등록된 소켓이 끊기면 세션을 지우고 종료 이벤트를 발행한다")
    void disconnectSocket() {
        // given
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", NOW);
        given(socketSessionRegistry.unregister(1L, socket)).willReturn(true);
        given(sessionRepository.delete(session)).willReturn(true);

        // when
        boolean disconnected = sessionCommandService.disconnectSocket(session, socket);

        // then
        assertThat(disconnected).isTrue();
        then(eventPublisher).should().publishEvent(new SessionClosedEvent(1L));
    }

    @Test
    @DisplayName("거절된 중복 소켓이 끊기면 세션을 지우지 않는다")
    void disconnectRejectedSocket() {
        // given
        Session session = new Session(1L, "s_key", "두더지4821", "⛏", NOW);
        given(socketSessionRegistry.unregister(1L, socket)).willReturn(false);

        // when
        boolean disconnected = sessionCommandService.disconnectSocket(session, socket);

        // then
        assertThat(disconnected).isFalse();
        then(sessionRepository).should(never()).delete(session);
    }

    @Test
    @DisplayName("TTL 스위퍼는 만료된 세션만 지우고 소켓을 닫는다")
    void expireStaleSessions() {
        // given
        Session neverConnected = new Session(1L, "s_old", "두더지4821", "⛏", NOW.minusSeconds(61));
        Session fresh = new Session(2L, "s_new", "곡괭이", "💎", NOW.minusSeconds(10));
        Session silent = new Session(3L, "s_silent", "탐험가", "🔦", NOW.minusSeconds(200));
        silent.connectSocket(NOW.minusSeconds(91));
        given(sessionRepository.findAll()).willReturn(List.of(neverConnected, fresh, silent));
        given(sessionRepository.delete(any(Session.class))).willReturn(true);

        // when
        sessionCommandService.expireStaleSessions();

        // then
        then(socketSessionRegistry).should().closeExpired(1L);
        then(socketSessionRegistry).should().closeExpired(3L);
        then(sessionRepository).should(never()).delete(fresh);
        then(eventPublisher).should().publishEvent(new SessionClosedEvent(1L));
        then(eventPublisher).should().publishEvent(new SessionClosedEvent(3L));
    }

    @Test
    @DisplayName("이미 끊김으로 지워진 세션은 스위퍼가 다시 처리하지 않는다")
    void expireAlreadyRemovedSession() {
        // given
        Session session = new Session(1L, "s_old", "두더지4821", "⛏", NOW.minusSeconds(61));
        given(sessionRepository.findAll()).willReturn(List.of(session));
        given(sessionRepository.delete(session)).willReturn(false);

        // when
        sessionCommandService.expireStaleSessions();

        // then
        then(eventPublisher).should(never()).publishEvent(any());
        then(socketSessionRegistry).should(never()).closeExpired(1L);
    }
}
