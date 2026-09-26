package com.seyeong.playgroundback.plaza.domain;

import java.util.concurrent.ThreadLocalRandom;

/**
 * 광장의 공간 규칙 (ERD 부록 A · B). 운영 중 바뀌지 않으므로 테이블이 아니라 상수로 둔다.
 * 화면 좌표와 반드시 일치해야 하므로 한곳에만 둔다.
 */
public final class PlazaRules {

    /** 정원 (P-22). 늘리면 {@link PlazaColors} 도 함께 늘려야 한다. */
    public static final int CAPACITY = 20;

    /** 걸어 다닐 수 있는 범위(%). 위쪽은 하늘·언덕이라 걸을 수 없다 (P-2). */
    public static final double MIN_X = 6;
    public static final double MAX_X = 94;
    public static final double MIN_Y = 56;
    public static final double MAX_Y = 94;

    /** 초당 화면 너비의 19%. 세로는 원근 때문에 그 60% 다 (P-2). */
    private static final double SPEED_X_PER_SECOND = 19;
    private static final double SPEED_Y_PER_SECOND = SPEED_X_PER_SECOND * 0.6;

    /**
     * 속도 검사에 주는 여유.
     * 클라이언트가 먼저 움직이고 뒤늦게 알리므로(그 사이 프레임이 밀리거나 패킷이 늦는다)
     * 딱 맞게 재면 정상 이동이 자꾸 거절된다. 순간이동만 걸러내면 충분하다.
     */
    private static final double SPEED_TOLERANCE = 1.5;
    private static final double LATENCY_GRACE_SECONDS = 0.5;

    private PlazaRules() {
    }

    /** 입장할 때 서는 자리. 늘 같은 곳에 세우면 여럿이 겹쳐 선다 (P-1). */
    public static double randomX() {
        return round(ThreadLocalRandom.current().nextDouble(MIN_X, MAX_X));
    }

    public static double randomY() {
        return round(ThreadLocalRandom.current().nextDouble(MIN_Y, MAX_Y));
    }

    /** 좌표는 소수 둘째 자리까지 둔다. 정수로 자르면 캐릭터가 한 칸씩 튀어 보인다. */
    private static double round(double value) {
        return Math.round(value * 100) / 100.0;
    }

    public static boolean contains(double x, double y) {
        return x >= MIN_X && x <= MAX_X && y >= MIN_Y && y <= MAX_Y;
    }

    /**
     * 주어진 시간 동안 갈 수 있는 거리인지 본다.
     * 가로·세로 속도가 달라 각 축을 속도로 나눈 뒤 길이를 잰다.
     */
    public static boolean reachable(double fromX, double fromY, double toX, double toY, double elapsedSeconds) {
        double allowed = (Math.max(0, elapsedSeconds) + LATENCY_GRACE_SECONDS) * SPEED_TOLERANCE;
        double dx = (toX - fromX) / SPEED_X_PER_SECOND;
        double dy = (toY - fromY) / SPEED_Y_PER_SECOND;
        return Math.hypot(dx, dy) <= allowed;
    }
}
