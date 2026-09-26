package com.seyeong.playgroundback.global.websocket;

import java.io.IOException;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

/**
 * 세션 id → 소켓. 전송 직렬화를 위해 ConcurrentWebSocketSessionDecorator 로 감싼 소켓을 보관한다.
 * 브로커가 없으므로 서버가 여기 등록한 소켓에만 쓴다.
 */
@Component
public class SocketSessionRegistry {

    private static final Logger log = LoggerFactory.getLogger(SocketSessionRegistry.class);

    private final Map<Long, WebSocketSession> socketsBySessionId = new ConcurrentHashMap<>();

    /** 이미 다른 소켓이 등록돼 있으면 false. */
    public boolean register(long sessionId, WebSocketSession socket) {
        return socketsBySessionId.putIfAbsent(sessionId, socket) == null;
    }

    /** 등록된 소켓이 바로 그 소켓일 때만 지운다. 거절된 중복 연결이 닫힐 때 원래 소켓을 지우지 않기 위해서다. */
    public boolean unregister(long sessionId, WebSocketSession socket) {
        WebSocketSession registered = socketsBySessionId.get(sessionId);
        if (registered == null || !registered.getId().equals(socket.getId())) {
            return false;
        }
        return socketsBySessionId.remove(sessionId, registered);
    }

    public Optional<WebSocketSession> find(long sessionId) {
        return Optional.ofNullable(socketsBySessionId.get(sessionId));
    }

    public Collection<WebSocketSession> findAll() {
        return List.copyOf(socketsBySessionId.values());
    }

    /** TTL 스위퍼가 세션을 지운 뒤 남은 소켓을 닫는다. */
    public void closeExpired(long sessionId) {
        WebSocketSession socket = socketsBySessionId.remove(sessionId);
        if (socket == null) {
            return;
        }
        try {
            socket.close(SocketCloseStatus.SESSION_INVALID);
        } catch (IOException exception) {
            log.warn("만료된 세션의 소켓을 닫지 못했습니다. sessionId={}", sessionId, exception);
        }
    }
}
