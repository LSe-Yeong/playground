package com.seyeong.playgroundback.global.websocket;

import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.global.response.ErrorResponse;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.service.SessionCommandService;
import com.seyeong.playgroundback.session.service.SessionReadService;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.PongMessage;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * 앱에 들어오자마자 연결해 끝까지 유지하는 소켓 하나 (허브 API 4장).
 * 연결되면 접속자로 등록하고, 끊기면 세션을 지운다 (0-4). 명령은 type 으로 카드별 처리기에 넘긴다.
 */
@Component
@RequiredArgsConstructor
public class PlaygroundWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(PlaygroundWebSocketHandler.class);

    private final SessionReadService sessionReadService;
    private final SessionCommandService sessionCommandService;
    private final SocketMessageSender socketMessageSender;
    private final List<SocketCommandHandler> commandHandlers;
    private final JsonMapper jsonMapper;
    private final PlaygroundProperties properties;

    @Override
    public void afterConnectionEstablished(WebSocketSession socket) throws IOException {
        Optional<Session> found = findSession(socket);
        if (found.isEmpty()) {
            socket.close(SocketCloseStatus.SESSION_INVALID);
            return;
        }
        if (!sessionCommandService.connectSocket(found.get(), decorate(socket))) {
            socket.close(SocketCloseStatus.ALREADY_CONNECTED);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession socket, TextMessage message) throws IOException {
        Optional<Session> found = findSession(socket);
        if (found.isEmpty()) {
            socket.close(SocketCloseStatus.SESSION_INVALID);
            return;
        }
        Session session = found.get();
        sessionCommandService.touch(session);
        dispatch(session, message.getPayload());
    }

    @Override
    protected void handlePongMessage(WebSocketSession socket, PongMessage message) {
        findSession(socket).ifPresent(sessionCommandService::touch);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession socket, CloseStatus status) {
        findSession(socket).ifPresent(session -> {
            if (sessionCommandService.disconnectSocket(session, socket)) {
                log.debug("소켓이 끊겨 세션을 정리했습니다. sessionId={}, status={}", session.getId(), status);
            }
        });
    }

    private void dispatch(Session session, String payload) {
        SocketCommand command = parse(payload);
        if (command == null) {
            socketMessageSender.sendError(session.getId(), ErrorResponse.of(CommonErrorCode.INVALID_REQUEST));
            return;
        }
        Optional<SocketCommandHandler> handler = commandHandlers.stream()
                .filter(candidate -> candidate.supports(command.type()))
                .findFirst();
        if (handler.isEmpty()) {
            socketMessageSender.sendError(session.getId(), ErrorResponse.of(CommonErrorCode.INVALID_REQUEST));
            return;
        }
        try {
            handler.get().handle(session, command);
        } catch (BusinessException exception) {
            socketMessageSender.sendError(session.getId(),
                    ErrorResponse.of(exception.getErrorCode(), exception.getMessage()));
        } catch (RuntimeException exception) {
            log.error("소켓 명령 처리 중 예외. type={}", command.type(), exception);
            socketMessageSender.sendError(session.getId(), ErrorResponse.of(CommonErrorCode.INTERNAL_ERROR));
        }
    }

    private SocketCommand parse(String payload) {
        try {
            SocketCommand command = jsonMapper.readValue(payload, SocketCommand.class);
            if (command == null || command.type() == null || command.type().isBlank()) {
                return null;
            }
            return command;
        } catch (JacksonException exception) {
            return null;
        }
    }

    private Optional<Session> findSession(WebSocketSession socket) {
        Object sessionKey = socket.getAttributes().get(SessionCookieHandshakeInterceptor.SESSION_KEY_ATTRIBUTE);
        if (!(sessionKey instanceof String key)) {
            return Optional.empty();
        }
        return sessionReadService.findSession(key);
    }

    private WebSocketSession decorate(WebSocketSession socket) {
        PlaygroundProperties.WebSocket policy = properties.websocket();
        return new ConcurrentWebSocketSessionDecorator(
                socket,
                (int) policy.sendTimeLimit().toMillis(),
                (int) policy.bufferSizeLimit().toBytes()
        );
    }
}
