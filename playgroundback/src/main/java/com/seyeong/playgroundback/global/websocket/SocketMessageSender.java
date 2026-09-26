package com.seyeong.playgroundback.global.websocket;

import com.seyeong.playgroundback.global.response.ErrorResponse;
import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.SessionLimitExceededException;
import tools.jackson.databind.json.JsonMapper;

@Component
@RequiredArgsConstructor
public class SocketMessageSender {

    private static final Logger log = LoggerFactory.getLogger(SocketMessageSender.class);

    private final SocketSessionRegistry socketSessionRegistry;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    public void send(long sessionId, SocketEvent<?> event) {
        socketSessionRegistry.find(sessionId).ifPresent(socket -> send(socket, event));
    }

    /** 방·광장에 속하지 않은 명령의 거절. seq 는 {@link SocketEvent#NO_SEQ} 다. */
    public void sendError(long sessionId, ErrorResponse error) {
        send(sessionId, SocketEvent.error(SocketEvent.NO_SEQ, Instant.now(clock), error));
    }

    private void send(WebSocketSession socket, SocketEvent<?> event) {
        TextMessage message = new TextMessage(jsonMapper.writeValueAsString(event));
        try {
            socket.sendMessage(message);
        } catch (IOException | SessionLimitExceededException exception) {
            log.warn("소켓 전송에 실패했습니다. socketId={}, type={}", socket.getId(), event.type(), exception);
        }
    }
}
