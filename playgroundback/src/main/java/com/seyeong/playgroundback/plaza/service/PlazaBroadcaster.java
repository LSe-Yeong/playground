package com.seyeong.playgroundback.plaza.service;

import com.seyeong.playgroundback.global.websocket.SocketEvent;
import com.seyeong.playgroundback.global.websocket.SocketMessageSender;
import com.seyeong.playgroundback.plaza.repository.PlazaRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 광장 안 사람들에게 이벤트를 보낸다. 브로커가 없어 서버가 직접 대상 소켓을 돌며 쓴다.
 *
 * <p>seq 는 광장 전체가 하나를 공유한다. 클라이언트는 이 값으로 순서가 어긋났는지 알 수 있다.
 * 전송은 항상 PlazaRepository 잠금 밖에서 한다 — 한 사람의 소켓이 막혔다고 광장이 멈추면 안 된다.
 */
@Component
@RequiredArgsConstructor
public class PlazaBroadcaster {

    private final PlazaRepository plazaRepository;
    private final SocketMessageSender socketMessageSender;
    private final Clock clock;

    private final AtomicLong sequence = new AtomicLong();

    public void broadcast(String type, Object payload) {
        send(plazaRepository.findAllSessionIds(), type, payload);
    }

    /** 입장 알림처럼 본인에게는 다른 경로로 이미 간 이벤트에 쓴다. */
    public void broadcastExcept(long excludedSessionId, String type, Object payload) {
        List<Long> targets = plazaRepository.findAllSessionIds().stream()
                .filter(sessionId -> sessionId != excludedSessionId)
                .toList();
        send(targets, type, payload);
    }

    public void sendTo(long sessionId, String type, Object payload) {
        send(List.of(sessionId), type, payload);
    }

    private void send(List<Long> sessionIds, String type, Object payload) {
        if (sessionIds.isEmpty()) {
            return;
        }
        SocketEvent<Object> event =
                new SocketEvent<>(type, sequence.incrementAndGet(), Instant.now(clock), payload);
        sessionIds.forEach(sessionId -> socketMessageSender.send(sessionId, event));
    }
}
