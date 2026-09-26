package com.seyeong.playgroundback.plaza.dto;

/** 나갔을 때. reason 은 left(스스로 나감) 또는 disconnected(연결이 끊김)다. */
public record PlazaLeftResponse(long memberId, String reason) {
}
