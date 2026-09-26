package com.seyeong.playgroundback.plaza.domain;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.plaza.exception.PlazaErrorCode;
import java.time.Duration;
import java.time.Instant;
import lombok.Getter;

/**
 * 지금 광장에 있는 사람 (ERD plaza_members). 서버 메모리에만 있다.
 * 읽기·쓰기가 모두 PlazaRepository 의 잠금 안에서만 일어나므로 필드에 volatile 을 두지 않는다.
 */
@Getter
public class PlazaMember {

    /** 바라보는 쪽. -1 왼쪽 / 0 정면 / 1 오른쪽 */
    public static final int FACING_LEFT = -1;
    public static final int FACING_RIGHT = 1;

    private final long id;
    private final long sessionId;
    private final Instant joinedAt;
    private String nickname;
    private String avatar;
    private String colorCode;
    private double x;
    private double y;
    private int facing;
    private PlazaSpot ridingSpot;
    private Integer ridingSeat;
    private Instant movedAt;

    public PlazaMember(long id, long sessionId, String nickname, String avatar, String colorCode,
                       double x, double y, Instant now) {
        validateColor(colorCode);
        if (!PlazaRules.contains(x, y)) {
            throw new BusinessException(PlazaErrorCode.OUT_OF_BOUNDS);
        }
        this.id = id;
        this.sessionId = sessionId;
        this.nickname = nickname;
        this.avatar = avatar;
        this.colorCode = colorCode;
        this.x = x;
        this.y = y;
        this.joinedAt = now;
        this.movedAt = now;
    }

    /**
     * 클라이언트가 보낸 좌표를 받아 쓴다. 매 프레임을 서버가 계산하면 반응이 굼떠 쓸 수 없어서다.
     * 대신 걷는 범위 안인지와 그동안 갈 수 있는 거리인지를 본다 — 범위만 보면 순간이동이 통과한다.
     */
    public void moveTo(double x, double y, int facing, Instant now) {
        if (!PlazaRules.contains(x, y)) {
            throw new BusinessException(PlazaErrorCode.OUT_OF_BOUNDS);
        }
        if (!PlazaRules.reachable(this.x, this.y, x, y, elapsedSecondsSinceMove(now))) {
            throw new BusinessException(PlazaErrorCode.OUT_OF_BOUNDS);
        }
        this.x = x;
        this.y = y;
        this.facing = facing;
        this.movedAt = now;
    }

    /** 프로필 변경을 따라간다 (M-P13). 실제로 바뀌었을 때만 true 라, 전파할지 여기서 판단한다. */
    public boolean syncProfile(String nickname, String avatar) {
        if (this.nickname.equals(nickname) && this.avatar.equals(avatar)) {
            return false;
        }
        this.nickname = nickname;
        this.avatar = avatar;
        return true;
    }

    /** 남이 쓰는 색인지는 광장 전체를 봐야 알 수 있어 서비스가 판단한다. */
    public void changeColor(String colorCode) {
        validateColor(colorCode);
        this.colorCode = colorCode;
    }

    public void ride(PlazaSpot spot, int seat) {
        if (isRiding()) {
            throw new BusinessException(PlazaErrorCode.ALREADY_RIDING);
        }
        if (!spot.isNear(x, y)) {
            throw new BusinessException(PlazaErrorCode.TOO_FAR);
        }
        this.ridingSpot = spot;
        this.ridingSeat = seat;
    }

    /** 내린 기구를 돌려준다. 타고 있지 않았으면 빈 값이다. */
    public PlazaSpot dismount() {
        PlazaSpot spot = ridingSpot;
        this.ridingSpot = null;
        this.ridingSeat = null;
        return spot;
    }

    public boolean isRiding() {
        return ridingSpot != null;
    }

    public boolean isRidingSeat(PlazaSpot spot, int seat) {
        return ridingSpot == spot && ridingSeat != null && ridingSeat == seat;
    }

    public boolean hasColor(String colorCode) {
        return this.colorCode.equals(colorCode);
    }

    public void requireNear(PlazaSpot spot) {
        if (!spot.isNear(x, y)) {
            throw new BusinessException(PlazaErrorCode.TOO_FAR);
        }
    }

    private double elapsedSecondsSinceMove(Instant now) {
        return Duration.between(movedAt, now).toNanos() / 1_000_000_000.0;
    }

    private static void validateColor(String colorCode) {
        if (!PlazaColors.isSupported(colorCode)) {
            throw new BusinessException(PlazaErrorCode.INVALID_COLOR);
        }
    }

    /** 방향 값은 -1 · 0 · 1 뿐이다. 소켓 payload 는 @Valid 를 타지 않아 여기서도 막는다. */
    public static int validateFacing(int facing) {
        if (facing < FACING_LEFT || facing > FACING_RIGHT) {
            throw new BusinessException(CommonErrorCode.VALIDATION_ERROR);
        }
        return facing;
    }
}
