package com.seyeong.playgroundback.plaza.domain;

import java.util.Arrays;
import java.util.Optional;

/**
 * 다가가서 무언가 할 수 있는 지점 (ERD 부록 A).
 * 반경을 가로·세로 따로 두는 이유: 걷는 범위가 가로 88% × 세로 38% 로 비대칭이라
 * 원형으로 잡으면 세로로 과하게 걸린다.
 */
public enum PlazaSpot {

    DJ("dj", 82, 49, 14, 10, 0),
    SWING("swing", 16, 66, 11, 8, 2),
    SEESAW("seesaw", 64, 74, 11, 8, 2),
    MERRY("merry", 9, 88, 10, 7, 1);

    private final String code;
    private final double x;
    private final double y;
    private final double radiusX;
    private final double radiusY;
    private final int seats;

    PlazaSpot(String code, double x, double y, double radiusX, double radiusY, int seats) {
        this.code = code;
        this.x = x;
        this.y = y;
        this.radiusX = radiusX;
        this.radiusY = radiusY;
        this.seats = seats;
    }

    public static Optional<PlazaSpot> from(String code) {
        return Arrays.stream(values()).filter(spot -> spot.code.equals(code)).findFirst();
    }

    public String getCode() {
        return code;
    }

    public int getSeats() {
        return seats;
    }

    public boolean isRideable() {
        return seats > 0;
    }

    /** 반경 안에 들어왔는지. 축마다 반경이 달라 정규화해서 잰다. */
    public boolean isNear(double posX, double posY) {
        double dx = (posX - x) / radiusX;
        double dy = (posY - y) / radiusY;
        return Math.hypot(dx, dy) <= 1;
    }
}
