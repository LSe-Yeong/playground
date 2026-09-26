package com.seyeong.playgroundback.plaza.exception;

import com.seyeong.playgroundback.global.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

/** 놀이터에서만 나는 에러 (API 명세 부록 A). 공통 에러는 CommonErrorCode 에 있다. */
@Getter
@RequiredArgsConstructor
public enum PlazaErrorCode implements ErrorCode {

    PLAZA_FULL(HttpStatus.CONFLICT, "놀이터 정원(20명)이 찼습니다"),
    NOT_IN_PLAZA(HttpStatus.FORBIDDEN, "놀이터에 있지 않습니다"),
    OUT_OF_BOUNDS(HttpStatus.BAD_REQUEST, "갈 수 없는 위치입니다"),
    TOO_FAR(HttpStatus.FORBIDDEN, "너무 멀리 있습니다"),
    SPOT_FULL(HttpStatus.CONFLICT, "자리가 없습니다"),
    ALREADY_RIDING(HttpStatus.CONFLICT, "이미 기구에 타고 있습니다"),
    TRACK_NOT_FOUND(HttpStatus.NOT_FOUND, "없는 곡입니다"),
    INVALID_COLOR(HttpStatus.BAD_REQUEST, "고를 수 없는 색입니다"),
    COLOR_TAKEN(HttpStatus.CONFLICT, "다른 사람이 쓰는 색입니다");

    private final HttpStatus status;
    private final String message;
}
