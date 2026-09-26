package com.seyeong.playgroundback.plaza.service;

import com.seyeong.playgroundback.plaza.domain.PlazaChatWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 광장의 주기 작업 두 가지.
 *
 * <p>배치 주기 100ms 는 설정이 아니라 약속이다. 클라이언트가 받은 좌표를 이 시간에 걸쳐 이어 그리므로
 * 한쪽만 바꾸면 움직임이 끊기거나 늘어진다.
 */
@Component
@RequiredArgsConstructor
public class PlazaScheduler {

    private static final long MOVE_BATCH_MILLIS = 100;

    private final PlazaCommandService plazaCommandService;

    @Scheduled(fixedRate = MOVE_BATCH_MILLIS)
    public void flushMoves() {
        plazaCommandService.flushMoves();
    }

    /** :00 :10 … :50 에 한 번. 서버가 한 번만 재고 결과를 전원에게 보낸다 (P-23). */
    @Scheduled(cron = "0 0/" + PlazaChatWindow.RESET_MINUTES + " * * * *")
    public void resetChat() {
        plazaCommandService.resetChat();
    }
}
