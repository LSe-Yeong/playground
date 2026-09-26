package com.seyeong.playgroundback.plaza.dto;

/** 내린 자리 옆에 그대로 선다. x · y 는 기구에 타기 전 좌표다. */
public record PlazaDismountResponse(long memberId, String spot, double x, double y) {
}
