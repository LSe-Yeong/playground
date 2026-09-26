package com.seyeong.playgroundback.global.websocket;

import com.seyeong.playgroundback.global.response.ErrorResponse;
import java.time.Instant;

/**
 * 서버 → 클라이언트 메시지.
 * seq 는 전파 단위(방·광장)마다 1씩 증가하고, at 은 서버 시각이다.
 * payload 는 null 일 수 있다 (예: 음악이 꺼졌을 때의 plaza.music).
 */
public record SocketEvent<T>(String type, long seq, Instant at, T payload) {

    public static final String ERROR_TYPE = "error";

    /** 방·광장 밖에서 보내는 메시지의 seq. 방·광장 안의 메시지는 그 공간의 seq 를 쓴다. */
    public static final long NO_SEQ = 0;

    public static SocketEvent<ErrorResponse> error(long seq, Instant at, ErrorResponse error) {
        return new SocketEvent<>(ERROR_TYPE, seq, at, error);
    }
}
