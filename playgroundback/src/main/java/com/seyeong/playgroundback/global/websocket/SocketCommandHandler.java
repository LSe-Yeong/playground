package com.seyeong.playgroundback.global.websocket;

import com.seyeong.playgroundback.session.domain.Session;

/**
 * 카드별 소켓 명령 처리기. type 접두사로 갈린다 (plaza.* · room.* · game.* · chat.*).
 * 거절할 때는 BusinessException 을 던진다. 보낸 사람에게 error 이벤트로 전달된다.
 */
public interface SocketCommandHandler {

    boolean supports(String type);

    void handle(Session session, SocketCommand command);
}
