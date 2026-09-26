package com.seyeong.playgroundback.plaza.dto;

/** 광장 안의 누가 프로필을 바꿨을 때 (0-7, M-P13). 이미 보낸 채팅의 이름은 그대로 둔다. */
public record PlazaProfileResponse(long memberId, String nickname, String avatar) {
}
