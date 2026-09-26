package com.seyeong.playgroundback.game.dto;

import com.seyeong.playgroundback.game.domain.Game;
import com.seyeong.playgroundback.game.domain.GameTag;
import com.seyeong.playgroundback.game.service.LiveCount;
import java.util.List;

public record GameResponse(
        String code,
        String name,
        String nameEn,
        String description,
        String thumbnailUrl,
        int minPlayers,
        int maxPlayers,
        String playMinutes,
        boolean playable,
        List<String> tags,
        Integer liveCount,
        Integer capacity
) {

    public static GameResponse of(Game game, LiveCount liveCount) {
        return new GameResponse(
                game.getCode(),
                game.getName(),
                game.getNameEn(),
                game.getDescription(),
                game.getThumbnailUrl(),
                game.getMinPlayers(),
                game.getMaxPlayers(),
                game.getPlayMinutes(),
                game.isPlayable(),
                game.getTags().stream().map(GameTag::getName).toList(),
                liveCount == null ? null : liveCount.count(),
                liveCount == null ? null : liveCount.capacity()
        );
    }
}
