package com.seyeong.playgroundback.game.service;

/**
 * 인원을 셀 수 있는 카드가 구현한다 (놀이터: P-22).
 * 구현이 없는 카드는 GET /games 에서 liveCount · capacity 가 null 이다.
 */
public interface LiveCountProvider {

    String gameCode();

    LiveCount getLiveCount();
}
