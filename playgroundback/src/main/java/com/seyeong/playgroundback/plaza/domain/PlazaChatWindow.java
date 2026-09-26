package com.seyeong.playgroundback.plaza.domain;

import java.time.Instant;

/**
 * 광장 채팅의 10분 구간 (P-23).
 * 광장은 사라지는 시점이 없어 대화를 자를 기회가 여기밖에 없다.
 * 에포크가 정각에서 시작하므로 초 단위로 끊으면 :00 :10 … :50 경계와 그대로 맞는다.
 */
public final class PlazaChatWindow {

    public static final int RESET_MINUTES = 10;

    /**
     * 한 구간에 남겨 두는 최대 줄 수. 10분마다 비우므로 평소에는 닿지 않지만,
     * 누가 쉬지 않고 보내도 메모리가 무한히 늘지 않게 한다.
     */
    public static final int MAX_RETAINED = 500;

    private static final long RESET_SECONDS = RESET_MINUTES * 60L;

    private PlazaChatWindow() {
    }

    /** 지금 구간이 시작된 경계. */
    public static Instant currentResetAt(Instant now) {
        return Instant.ofEpochSecond(Math.floorDiv(now.getEpochSecond(), RESET_SECONDS) * RESET_SECONDS);
    }

    /** 다음 경계. 클라이언트가 남은 시간을 보여주는 데 쓴다. */
    public static Instant nextResetAt(Instant now) {
        return currentResetAt(now).plusSeconds(RESET_SECONDS);
    }
}
