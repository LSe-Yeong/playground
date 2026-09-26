package com.seyeong.playgroundback.plaza.dto;

/** 자리 번호는 서버가 고른 값이다. 보낸 사람도 이 이벤트로 자기 자리를 안다. */
public record PlazaRideResponse(long memberId, String spot, int seat) {
}
