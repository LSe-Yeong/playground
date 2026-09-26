package com.seyeong.playgroundback.session.domain;

/**
 * 프로필을 바꿨을 때 발행한다 (0-7).
 * 광장은 이 이벤트를 받아 그 사람의 이름·아바타를 즉시 따라 바꾼다 (M-P13).
 */
public record SessionProfileChangedEvent(long sessionId, String nickname, String avatar) {

    public static SessionProfileChangedEvent from(Session session) {
        return new SessionProfileChangedEvent(session.getId(), session.getNickname(), session.getAvatar());
    }
}
