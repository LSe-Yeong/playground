package com.seyeong.playgroundback.game.fixture;

import com.seyeong.playgroundback.game.domain.Game;

public final class GameFixture {

    private GameFixture() {
    }

    public static Game playableGame(String code, int sortOrder) {
        return Game.builder()
                .code(code)
                .name("한번더")
                .nameEn("OneMoreTime")
                .description("주사위 4개로 11개의 갱도를 파내려가, 가장 깊은 곳의 보물 3개를 먼저 찾는 사람이 이긴다")
                .thumbnailUrl("https://cdn.playground.app/games/omt-thumb.webp")
                .minPlayers(2)
                .maxPlayers(6)
                .playMinutes("15~20분")
                .playable(true)
                .sortOrder(sortOrder)
                .build();
    }

    public static Game comingSoonGame(String code, int sortOrder) {
        return Game.builder()
                .code(code)
                .name("게임 2")
                .nameEn("Coming Soon")
                .description("다음 게임을 준비하고 있습니다")
                .thumbnailUrl("https://cdn.playground.app/games/coming-soon.webp")
                .minPlayers(0)
                .maxPlayers(0)
                .playable(false)
                .sortOrder(sortOrder)
                .build();
    }
}
