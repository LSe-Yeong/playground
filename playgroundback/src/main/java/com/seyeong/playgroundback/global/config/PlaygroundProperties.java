package com.seyeong.playgroundback.global.config;

import java.time.Duration;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

/**
 * @param allowedOrigins 프론트가 있는 곳. REST 의 CORS 와 소켓 핸드셰이크가 같은 목록을 쓴다.
 *                       쿠키를 주고받으므로 {@code *} 는 쓸 수 없고 패턴으로 적는다
 */
@ConfigurationProperties("playground")
public record PlaygroundProperties(List<String> allowedOrigins, Session session, WebSocket websocket) {

    /**
     * @param connectTimeout   발급 후 이 시간 안에 소켓이 붙지 않으면 세션을 지운다
     * @param heartbeatTimeout 마지막 신호 후 이 시간이 지나면 끊긴 것으로 본다
     * @param sweepInterval    TTL 스위퍼 주기
     */
    public record Session(
            String cookieName,
            boolean cookieSecure,
            Duration connectTimeout,
            Duration heartbeatTimeout,
            Duration sweepInterval
    ) {
    }

    /**
     * @param pingInterval    서버가 ping 을 보내는 주기. 브라우저가 pong 으로 답하면 last_seen_at 이 갱신된다
     * @param sendTimeLimit   ConcurrentWebSocketSessionDecorator 의 전송 시간 한도
     * @param bufferSizeLimit ConcurrentWebSocketSessionDecorator 의 버퍼 한도
     */
    public record WebSocket(
            Duration pingInterval,
            Duration sendTimeLimit,
            DataSize bufferSizeLimit
    ) {
    }
}
