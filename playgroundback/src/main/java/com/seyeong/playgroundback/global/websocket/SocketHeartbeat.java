package com.seyeong.playgroundback.global.websocket;

import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.PingMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.SessionLimitExceededException;

/**
 * 30초마다 ping 을 보낸다. 브라우저가 pong 으로 자동 응답하면 last_seen_at 이 갱신되고,
 * 응답이 끊기면 TTL 스위퍼가 세션을 지운다. 브라우저 JS 는 ping 을 보낼 수 없어 서버가 보낸다.
 */
@Component
@RequiredArgsConstructor
public class SocketHeartbeat {

    private static final Logger log = LoggerFactory.getLogger(SocketHeartbeat.class);

    private final SocketSessionRegistry socketSessionRegistry;

    @Scheduled(
            initialDelayString = "${playground.websocket.ping-interval}",
            fixedRateString = "${playground.websocket.ping-interval}"
    )
    public void sendPing() {
        socketSessionRegistry.findAll().forEach(this::sendPing);
    }

    private void sendPing(WebSocketSession socket) {
        try {
            socket.sendMessage(new PingMessage());
        } catch (IOException | SessionLimitExceededException exception) {
            log.debug("ping 전송에 실패했습니다. socketId={}", socket.getId(), exception);
        }
    }
}
