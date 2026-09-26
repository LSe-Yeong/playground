package com.seyeong.playgroundback.plaza.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.plaza.exception.PlazaErrorCode;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlazaMemberTest {

    private static final Instant NOW = Instant.parse("2026-09-25T10:00:00Z");

    private PlazaMember member(double x, double y) {
        return new PlazaMember(1L, 100L, "두더지4821", "⛏", "red", x, y, NOW);
    }

    @Test
    @DisplayName("걷는 범위 밖으로는 갈 수 없다")
    void moveOutOfBounds() {
        PlazaMember member = member(50, 75);

        assertThatThrownBy(() -> member.moveTo(50, 40, 0, NOW.plusSeconds(10)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.OUT_OF_BOUNDS);
    }

    @Test
    @DisplayName("범위 안이어도 그 사이 갈 수 없는 거리면 거절한다")
    void moveTooFastIsRejected() {
        PlazaMember member = member(10, 60);

        // 0.2초 만에 가로로 80% 를 건널 수는 없다
        assertThatThrownBy(() -> member.moveTo(90, 60, 1, NOW.plusMillis(200)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.OUT_OF_BOUNDS);
        assertThat(member.getX()).isEqualTo(10);
    }

    @Test
    @DisplayName("시간이 충분히 지났으면 같은 거리도 받아들인다")
    void moveWithinSpeed() {
        PlazaMember member = member(10, 60);

        member.moveTo(90, 60, 1, NOW.plusSeconds(5));

        assertThat(member.getX()).isEqualTo(90);
        assertThat(member.getFacing()).isEqualTo(PlazaMember.FACING_RIGHT);
        assertThat(member.getMovedAt()).isEqualTo(NOW.plusSeconds(5));
    }

    @Test
    @DisplayName("기구에서 멀면 탈 수 없다")
    void rideTooFar() {
        PlazaMember member = member(50, 75);

        assertThatThrownBy(() -> member.ride(PlazaSpot.SWING, 0))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.TOO_FAR);
    }

    @Test
    @DisplayName("이미 타고 있으면 다른 기구로 옮겨 탈 수 없다")
    void rideWhileRiding() {
        PlazaMember member = member(16, 66);
        member.ride(PlazaSpot.SWING, 0);

        assertThatThrownBy(() -> member.ride(PlazaSpot.SWING, 1))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.ALREADY_RIDING);
    }

    @Test
    @DisplayName("내리면 타고 있던 기구를 돌려주고 자리를 비운다")
    void dismountReturnsSpot() {
        PlazaMember member = member(16, 66);
        member.ride(PlazaSpot.SWING, 1);

        assertThat(member.dismount()).isEqualTo(PlazaSpot.SWING);
        assertThat(member.isRiding()).isFalse();
        assertThat(member.isRidingSeat(PlazaSpot.SWING, 1)).isFalse();
    }

    @Test
    @DisplayName("타고 있지 않은 채 내리면 빈 값이다")
    void dismountWithoutRiding() {
        assertThat(member(16, 66).dismount()).isNull();
    }

    @Test
    @DisplayName("24색 밖의 색은 고를 수 없다")
    void changeToUnsupportedColor() {
        PlazaMember member = member(50, 75);

        assertThatThrownBy(() -> member.changeColor("무지개"))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.INVALID_COLOR);
        assertThat(member.getColorCode()).isEqualTo("red");
    }

    @Test
    @DisplayName("프로필이 실제로 바뀌었을 때만 전파 대상이 된다")
    void syncProfileReportsChange() {
        PlazaMember member = member(50, 75);

        assertThat(member.syncProfile("두더지4821", "⛏")).isFalse();
        assertThat(member.syncProfile("곡괭이1007", "⛏")).isTrue();
        assertThat(member.getNickname()).isEqualTo("곡괭이1007");
    }
}
