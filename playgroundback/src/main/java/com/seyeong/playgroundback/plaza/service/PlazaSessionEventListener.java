package com.seyeong.playgroundback.plaza.service;

import com.seyeong.playgroundback.plaza.domain.PlazaLeaveReason;
import com.seyeong.playgroundback.session.domain.SessionClosedEvent;
import com.seyeong.playgroundback.session.domain.SessionProfileChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * 세션 쪽 변화를 광장에 옮긴다. 세션 모듈이 광장을 알 필요가 없도록 이벤트로 받는다.
 */
@Component
@RequiredArgsConstructor
public class PlazaSessionEventListener {

    private final PlazaCommandService plazaCommandService;

    /** 소켓이 끊기거나 TTL 이 지나면 광장에서도 내보낸다 (0-4). 새로고침도 여기에 해당한다. */
    @EventListener
    public void onSessionClosed(SessionClosedEvent event) {
        plazaCommandService.leave(event.sessionId(), PlazaLeaveReason.DISCONNECTED);
    }

    @EventListener
    public void onProfileChanged(SessionProfileChangedEvent event) {
        plazaCommandService.syncProfile(event.sessionId(), event.nickname(), event.avatar());
    }
}
