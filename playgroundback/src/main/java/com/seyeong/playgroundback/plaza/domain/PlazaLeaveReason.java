package com.seyeong.playgroundback.plaza.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** plaza.left 의 reason. 새로고침은 disconnected 로 잡힌다. */
@Getter
@RequiredArgsConstructor
public enum PlazaLeaveReason {

    LEFT("left"),
    DISCONNECTED("disconnected");

    private final String code;
}
