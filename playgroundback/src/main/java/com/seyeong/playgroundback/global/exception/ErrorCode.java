package com.seyeong.playgroundback.global.exception;

import org.springframework.http.HttpStatus;

/**
 * 도메인마다 enum 으로 구현한다. 코드 문자열은 enum 상수 이름을 그대로 쓴다.
 * 소켓에는 HTTP 상태가 없지만 같은 코드를 공유한다.
 */
public interface ErrorCode {

    String name();

    HttpStatus getStatus();

    String getMessage();

    default String getCode() {
        return name();
    }
}
