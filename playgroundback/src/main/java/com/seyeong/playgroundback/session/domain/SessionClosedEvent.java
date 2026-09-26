package com.seyeong.playgroundback.session.domain;

/**
 * 세션이 사라졌을 때 발행한다 (소켓 끊김 · TTL 만료).
 * 방·광장은 이 이벤트를 받아 그 사람을 내보낸다 (0-4).
 */
public record SessionClosedEvent(long sessionId) {
}
