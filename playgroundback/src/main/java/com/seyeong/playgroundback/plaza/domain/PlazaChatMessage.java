package com.seyeong.playgroundback.plaza.domain;

import java.time.Instant;

/**
 * 광장 채팅 한 줄 (ERD plaza_chat).
 * 이름·아바타·색을 작성 시점 값으로 박아 둔다. 뒤에 프로필을 바꿔도 지난 대화는 그대로 둔다 —
 * 이미 보낸 글의 이름까지 바뀌면 누가 무슨 말을 했는지가 흐려진다.
 */
public record PlazaChatMessage(
        long id,
        long memberId,
        String nickname,
        String avatar,
        String colorCode,
        String body,
        Instant createdAt
) {

    public static PlazaChatMessage of(long id, PlazaMember writer, String body, Instant now) {
        return new PlazaChatMessage(
                id,
                writer.getId(),
                writer.getNickname(),
                writer.getAvatar(),
                writer.getColorCode(),
                body,
                now
        );
    }
}
