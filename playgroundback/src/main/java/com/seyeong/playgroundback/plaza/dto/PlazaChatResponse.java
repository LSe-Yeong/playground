package com.seyeong.playgroundback.plaza.dto;

import com.seyeong.playgroundback.plaza.domain.PlazaChatMessage;
import java.time.Instant;

/** 허브 API 의 ChatMessage 모양. 작성 시점 이름·아바타·색을 그대로 싣는다. */
public record PlazaChatResponse(
        long id,
        long playerId,
        String nickname,
        String avatar,
        String color,
        String body,
        Instant at
) {

    public static PlazaChatResponse from(PlazaChatMessage message) {
        return new PlazaChatResponse(
                message.id(),
                message.memberId(),
                message.nickname(),
                message.avatar(),
                message.colorCode(),
                message.body(),
                message.createdAt()
        );
    }
}
