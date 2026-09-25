package com.seyeong.playgroundback.global.response;

import com.seyeong.playgroundback.global.exception.ErrorCode;

/**
 * REST 의 {@code error} 객체이자 소켓 {@code error} 이벤트의 payload 다.
 * message 는 화면에 그대로 띄울 수 있는 한국어다.
 */
public record ErrorResponse(String code, String message) {

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(errorCode.getCode(), errorCode.getMessage());
    }

    public static ErrorResponse of(ErrorCode errorCode, String message) {
        return new ErrorResponse(errorCode.getCode(), message);
    }
}
