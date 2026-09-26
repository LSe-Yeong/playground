package com.seyeong.playgroundback.global.auth;

import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.web.util.WebUtils;

/**
 * 세션 쿠키 (허브 API 2장 인증). 만료를 두지 않는 브라우저 세션 쿠키이고,
 * 실제 수명은 서버가 정한다 — 소켓이 끊기거나 TTL 이 지나면 서버에서 세션이 사라진다.
 */
@Component
@RequiredArgsConstructor
public class SessionCookieFactory {

    private static final String SAME_SITE = "Lax";

    private final PlaygroundProperties properties;

    /** 요청에 실린 세션 키. 쿠키가 없거나 비었으면 비어 있다. */
    public Optional<String> readKey(HttpServletRequest request) {
        if (request == null) {
            return Optional.empty();
        }
        Cookie cookie = WebUtils.getCookie(request, properties.session().cookieName());
        if (cookie == null || cookie.getValue().isBlank()) {
            return Optional.empty();
        }
        return Optional.of(cookie.getValue());
    }

    public ResponseCookie create(String sessionKey, String path) {
        PlaygroundProperties.Session policy = properties.session();
        return ResponseCookie.from(policy.cookieName(), sessionKey)
                .httpOnly(true)
                .secure(policy.cookieSecure())
                .sameSite(SAME_SITE)
                .path(path)
                .build();
    }
}
