package com.seyeong.playgroundback.global.websocket;

import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import jakarta.servlet.http.Cookie;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.WebUtils;

/**
 * 핸드셰이크 때 세션 쿠키를 읽어 소켓 속성에 담는다. 이후에는 HTTP 요청이 없어 신원을 알 방법이 없다.
 * 쿠키가 없거나 무효여도 여기서 거절하지 않는다 — 연결 뒤 4401 로 닫아야 클라이언트가 이유를 안다.
 */
@Component
@RequiredArgsConstructor
public class SessionCookieHandshakeInterceptor implements HandshakeInterceptor {

    public static final String SESSION_KEY_ATTRIBUTE = "sessionKey";

    private final PlaygroundProperties properties;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            Cookie cookie = WebUtils.getCookie(servletRequest.getServletRequest(), properties.session().cookieName());
            if (cookie != null) {
                attributes.put(SESSION_KEY_ATTRIBUTE, cookie.getValue());
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // 핸드셰이크 이후 할 일이 없다
    }
}
