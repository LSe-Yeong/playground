package com.seyeong.playgroundback.plaza.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * 입력이 바뀔 때(걷기 시작·방향 전환·멈춤)와 1초마다 온다. 매 프레임 오지 않는다.
 * 걷는 범위와 속도 검사는 PlazaMember 가 한다.
 *
 * @param dir -1 왼쪽 / 0 정면 / 1 오른쪽
 */
public record PlazaMoveCommand(
        @NotNull Double x,
        @NotNull Double y,
        @NotNull @Min(-1) @Max(1) Integer dir
) {
}
