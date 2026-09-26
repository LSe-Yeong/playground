package com.seyeong.playgroundback.global.websocket;

import static org.assertj.core.api.Assertions.assertThat;

import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.repository.SessionRepository;
import com.seyeong.playgroundback.session.service.SessionCommandService;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.WebSocket;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/** 실제 서버를 띄워 핸드셰이크 · 접속 등록 · 끊김 정리를 확인한다. */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PlaygroundWebSocketHandlerIntegrationTest {

    private static final long TIMEOUT_SECONDS = 5;

    @LocalServerPort
    private int port;

    @Autowired
    private SessionCommandService sessionCommandService;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private SocketSessionRegistry socketSessionRegistry;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Test
    @DisplayName("세션 쿠키 없이 연결하면 4401 로 닫힌다")
    void connectWithoutCookie() throws Exception {
        // given
        CloseListener listener = new CloseListener();

        // when
        httpClient.newWebSocketBuilder()
                .buildAsync(socketUri(), listener)
                .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);

        // then
        assertThat(listener.closeCode.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)).isEqualTo(4401);
    }

    @Test
    @DisplayName("유효한 세션으로 연결하면 접속자로 등록되고, 끊으면 세션이 지워진다")
    void connectAndDisconnect() throws Exception {
        // given
        Session session = sessionCommandService.createSession("두더지4821", "⛏");

        // when
        WebSocket socket = connect(session.getSessionKey(), new CloseListener());
        awaitUntil(() -> socketSessionRegistry.find(session.getId()).isPresent());

        // then
        assertThat(session.isSocketConnected()).isTrue();

        // when
        socket.sendClose(WebSocket.NORMAL_CLOSURE, "bye").get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        awaitUntil(() -> sessionRepository.findBySessionKey(session.getSessionKey()).isEmpty());

        // then
        assertThat(socketSessionRegistry.find(session.getId())).isEmpty();
    }

    @Test
    @DisplayName("같은 세션으로 두 번째 소켓을 붙이면 4409 로 닫히고 첫 번째 연결은 유지된다")
    void connectTwice() throws Exception {
        // given
        Session session = sessionCommandService.createSession("두더지4821", "⛏");
        connect(session.getSessionKey(), new CloseListener());
        awaitUntil(() -> socketSessionRegistry.find(session.getId()).isPresent());
        CloseListener secondListener = new CloseListener();

        // when
        connect(session.getSessionKey(), secondListener);

        // then
        assertThat(secondListener.closeCode.get(TIMEOUT_SECONDS, TimeUnit.SECONDS)).isEqualTo(4409);
        assertThat(sessionRepository.findBySessionKey(session.getSessionKey())).isPresent();
        assertThat(socketSessionRegistry.find(session.getId())).isPresent();
    }

    @Test
    @DisplayName("알 수 없는 명령을 보내면 error 이벤트로 INVALID_REQUEST 를 받는다")
    void sendUnknownCommand() throws Exception {
        // given
        Session session = sessionCommandService.createSession("두더지4821", "⛏");
        CloseListener listener = new CloseListener();
        WebSocket socket = connect(session.getSessionKey(), listener);
        awaitUntil(() -> socketSessionRegistry.find(session.getId()).isPresent());

        // when
        socket.sendText("{\"type\":\"unknown.command\",\"payload\":{}}", true);

        // then
        String message = listener.firstText.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        assertThat(message).contains("\"type\":\"error\"").contains("\"code\":\"INVALID_REQUEST\"");
    }

    private WebSocket connect(String sessionKey, CloseListener listener) throws Exception {
        return httpClient.newWebSocketBuilder()
                .header("Cookie", "sessionKey=" + sessionKey)
                .buildAsync(socketUri(), listener)
                .get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    private URI socketUri() {
        return URI.create("ws://localhost:" + port + "/pg/api/ws");
    }

    private void awaitUntil(java.util.function.BooleanSupplier condition) throws InterruptedException {
        long deadline = System.nanoTime() + Duration.ofSeconds(TIMEOUT_SECONDS).toNanos();
        while (!condition.getAsBoolean()) {
            if (System.nanoTime() > deadline) {
                throw new AssertionError("제한 시간 안에 조건이 충족되지 않았습니다");
            }
            Thread.sleep(20);
        }
    }

    private static class CloseListener implements WebSocket.Listener {

        private final CompletableFuture<Integer> closeCode = new CompletableFuture<>();
        private final CompletableFuture<String> firstText = new CompletableFuture<>();
        private final StringBuilder buffer = new StringBuilder();

        @Override
        public CompletionStage<?> onText(WebSocket webSocket, CharSequence data, boolean last) {
            buffer.append(data);
            if (last) {
                firstText.complete(buffer.toString());
                buffer.setLength(0);
            }
            webSocket.request(1);
            return null;
        }

        @Override
        public CompletionStage<?> onClose(WebSocket webSocket, int statusCode, String reason) {
            closeCode.complete(statusCode);
            return null;
        }
    }
}
