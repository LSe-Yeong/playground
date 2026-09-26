package com.seyeong.playgroundback.session.dto;

import com.seyeong.playgroundback.session.domain.Session;

/**
 * 세션 키는 담지 않는다. 쿠키가 HttpOnly 인데 본문으로 다시 내주면 감춘 의미가 없고,
 * 클라이언트는 쿠키가 자동으로 붙으므로 값을 알 필요도 없다.
 */
public record SessionResponse(String nickname, String avatar) {

    public static SessionResponse from(Session session) {
        return new SessionResponse(session.getNickname(), session.getAvatar());
    }
}
