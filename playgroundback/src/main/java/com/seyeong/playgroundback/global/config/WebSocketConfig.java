package com.seyeong.playgroundback.global.config;

import com.seyeong.playgroundback.global.websocket.PlaygroundWebSocketHandler;
import com.seyeong.playgroundback.global.websocket.SessionCookieHandshakeInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/** 원시 WebSocket (STOMP 아님). context-path 가 붙으므로 실제 경로는 /pg/api/ws 다. */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private static final String WEBSOCKET_PATH = "/ws";

    private final PlaygroundWebSocketHandler playgroundWebSocketHandler;
    private final SessionCookieHandshakeInterceptor sessionCookieHandshakeInterceptor;
    private final PlaygroundProperties properties;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(playgroundWebSocketHandler, WEBSOCKET_PATH)
                .addInterceptors(sessionCookieHandshakeInterceptor)
                .setAllowedOriginPatterns(properties.allowedOrigins().toArray(String[]::new));
    }
}
