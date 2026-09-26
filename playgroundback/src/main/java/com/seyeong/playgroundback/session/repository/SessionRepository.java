package com.seyeong.playgroundback.session.repository;

import com.seyeong.playgroundback.session.domain.Session;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.stereotype.Repository;

/** 세션은 휘발성이라 RDB 가 아니라 메모리에 둔다 (ERD: 단일 인스턴스 + 서버 메모리). */
@Repository
public class SessionRepository {

    private final AtomicLong sequence = new AtomicLong();
    private final Map<String, Session> sessionsByKey = new ConcurrentHashMap<>();

    public long nextId() {
        return sequence.incrementAndGet();
    }

    public Session save(Session session) {
        sessionsByKey.put(session.getSessionKey(), session);
        return session;
    }

    public Optional<Session> findBySessionKey(String sessionKey) {
        return Optional.ofNullable(sessionsByKey.get(sessionKey));
    }

    public Collection<Session> findAll() {
        return List.copyOf(sessionsByKey.values());
    }

    /** 이미 지워졌으면 false. 끊김과 만료가 겹쳐도 한 번만 처리되게 한다. */
    public boolean delete(Session session) {
        return sessionsByKey.remove(session.getSessionKey(), session);
    }
}
