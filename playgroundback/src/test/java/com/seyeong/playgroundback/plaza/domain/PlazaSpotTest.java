package com.seyeong.playgroundback.plaza.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlazaSpotTest {

    @Test
    @DisplayName("없는 기구 코드는 찾히지 않는다")
    void unknownCode() {
        assertThat(PlazaSpot.from("slide")).isEmpty();
        assertThat(PlazaSpot.from("swing")).contains(PlazaSpot.SWING);
    }

    @Test
    @DisplayName("DJ 부스는 탈 수 없고 나머지는 탈 수 있다")
    void onlyEquipmentIsRideable() {
        assertThat(PlazaSpot.DJ.isRideable()).isFalse();
        assertThat(PlazaSpot.SWING.isRideable()).isTrue();
        assertThat(PlazaSpot.SEESAW.getSeats()).isEqualTo(2);
        assertThat(PlazaSpot.MERRY.getSeats()).isEqualTo(1);
    }

    @Test
    @DisplayName("근접 반경은 가로·세로가 달라 세로로 더 좁게 잡힌다")
    void proximityRadiusIsNotCircular() {
        // 그네는 (16, 66) 에 가로 11 · 세로 8 이다
        assertThat(PlazaSpot.SWING.isNear(16, 66)).isTrue();
        assertThat(PlazaSpot.SWING.isNear(26, 66)).isTrue();
        assertThat(PlazaSpot.SWING.isNear(28, 66)).isFalse();
        assertThat(PlazaSpot.SWING.isNear(16, 73)).isTrue();
        assertThat(PlazaSpot.SWING.isNear(16, 75)).isFalse();
    }
}
