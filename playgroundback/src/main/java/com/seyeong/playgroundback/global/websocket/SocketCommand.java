package com.seyeong.playgroundback.global.websocket;

import tools.jackson.databind.JsonNode;

/**
 * 클라이언트 → 서버 메시지. payload 는 type 에 따라 해당 명령 DTO 로 변환한다.
 */
public record SocketCommand(String type, JsonNode payload) {
}
