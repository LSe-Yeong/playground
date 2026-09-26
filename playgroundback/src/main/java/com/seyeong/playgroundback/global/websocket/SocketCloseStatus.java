package com.seyeong.playgroundback.global.websocket;

import org.springframework.web.socket.CloseStatus;

/** 4xxx 는 애플리케이션이 정하는 종료 코드다. 뒤 세 자리를 HTTP 상태에 맞춘다. */
public final class SocketCloseStatus {

    /** 세션 쿠키 없음 · 무효 · 만료 (허브 API 4장). */
    public static final CloseStatus SESSION_INVALID = new CloseStatus(4401, "SESSION_INVALID");

    /** 같은 세션에 이미 소켓이 붙어 있음. 한 세션에는 소켓 하나만 붙는다. */
    public static final CloseStatus ALREADY_CONNECTED = new CloseStatus(4409, "ALREADY_CONNECTED");

    private SocketCloseStatus() {
    }
}
