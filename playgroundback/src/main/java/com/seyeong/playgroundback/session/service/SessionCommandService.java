package com.seyeong.playgroundback.session.service;

import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import com.seyeong.playgroundback.global.websocket.SocketSessionRegistry;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.domain.SessionClosedEvent;
import com.seyeong.playgroundback.session.domain.SessionProfileChangedEvent;
import com.seyeong.playgroundback.session.repository.SessionRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

/** 세션은 메모리에만 있어 트랜잭션을 걸지 않는다. */
@Service
@RequiredArgsConstructor
public class SessionCommandService {

    private final SessionRepository sessionRepository;
    private final SessionKeyGenerator sessionKeyGenerator;
    private final SocketSessionRegistry socketSessionRegistry;
    private final ApplicationEventPublisher eventPublisher;
    private final PlaygroundProperties properties;
    private final Clock clock;

    /**
     * 세션을 보장한다. 쿠키에 실린 세션이 아직 살아 있으면 그것을 그대로 쓰고 프로필만 맞춘다.
     * 새로 만들어 버리면 탭을 하나 더 열 때마다 세션이 늘어, 한 사람이 접속자 여럿으로 잡힌다.
     */
    public SessionIssue issueSession(String sessionKey, String nickname, String avatar) {
        if (sessionKey != null) {
            Optional<Session> found = sessionRepository.findBySessionKey(sessionKey);
            if (found.isPresent()) {
                Session session = found.get();
                updateProfile(session, nickname, avatar);
                return new SessionIssue(session, false);
            }
        }
        return new SessionIssue(createSession(nickname, avatar), true);
    }

    public Session createSession(String nickname, String avatar) {
        Session session = new Session(
                sessionRepository.nextId(),
                sessionKeyGenerator.generate(),
                nickname,
                avatar,
                Instant.now(clock)
        );
        return sessionRepository.save(session);
    }

    /** 광장에 있는 사람이면 이름·아바타가 그 자리에서 함께 바뀐다 (M-P13). */
    public Session updateProfile(Session session, String nickname, String avatar) {
        session.updateProfile(nickname, avatar);
        eventPublisher.publishEvent(SessionProfileChangedEvent.from(session));
        return session;
    }

    /** 한 세션에는 소켓 하나만 붙는다. 이미 붙어 있으면 false. */
    public boolean connectSocket(Session session, WebSocketSession socket) {
        if (!socketSessionRegistry.register(session.getId(), socket)) {
            return false;
        }
        session.connectSocket(Instant.now(clock));
        return true;
    }

    public void touch(Session session) {
        session.touch(Instant.now(clock));
    }

    /**
     * 소켓이 끊겼을 때. 재접속 복구가 없으므로 세션을 지운다 (0-4).
     * 등록된 소켓이 아니면(거절된 중복 연결) 아무것도 하지 않고 false.
     */
    public boolean disconnectSocket(Session session, WebSocketSession socket) {
        if (!socketSessionRegistry.unregister(session.getId(), socket)) {
            return false;
        }
        return remove(session);
    }

    /** 세션 TTL 스위퍼. 소켓 미연결 · 신호 끊김 세션을 소켓 끊김과 같은 방식으로 지운다. */
    public void expireStaleSessions() {
        Instant now = Instant.now(clock);
        PlaygroundProperties.Session policy = properties.session();
        sessionRepository.findAll().stream()
                .filter(session -> session.isExpired(now, policy.connectTimeout(), policy.heartbeatTimeout()))
                .forEach(this::expire);
    }

    private void expire(Session session) {
        if (remove(session)) {
            socketSessionRegistry.closeExpired(session.getId());
        }
    }

    private boolean remove(Session session) {
        if (!sessionRepository.delete(session)) {
            return false;
        }
        eventPublisher.publishEvent(new SessionClosedEvent(session.getId()));
        return true;
    }
}
