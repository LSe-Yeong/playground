package com.seyeong.playgroundback.game.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.seyeong.playgroundback.game.dto.GameListResponse;
import com.seyeong.playgroundback.game.dto.GameResponse;
import com.seyeong.playgroundback.game.fixture.GameFixture;
import com.seyeong.playgroundback.game.repository.GameRepository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;

    @Mock
    private LiveCountProvider plazaLiveCountProvider;

    @Test
    @DisplayName("인원을 셀 수 있는 카드는 liveCount 와 capacity 를 채운다")
    void getGamesWithLiveCount() {
        // given
        given(plazaLiveCountProvider.gameCode()).willReturn("plaza");
        given(plazaLiveCountProvider.getLiveCount()).willReturn(new LiveCount(8, 20));
        given(gameRepository.findAllWithTagsOrderBySortOrder())
                .willReturn(List.of(GameFixture.playableGame("plaza", 0)));
        GameService gameService = new GameService(gameRepository, List.of(plazaLiveCountProvider));

        // when
        GameListResponse response = gameService.getGames();

        // then
        GameResponse plaza = response.games().getFirst();
        assertThat(plaza.liveCount()).isEqualTo(8);
        assertThat(plaza.capacity()).isEqualTo(20);
    }

    @Test
    @DisplayName("인원을 셀 수 없는 카드는 liveCount 와 capacity 가 null 이다")
    void getGamesWithoutLiveCount() {
        // given
        given(gameRepository.findAllWithTagsOrderBySortOrder())
                .willReturn(List.of(GameFixture.playableGame("onemore", 0)));
        GameService gameService = new GameService(gameRepository, List.of());

        // when
        GameListResponse response = gameService.getGames();

        // then
        GameResponse onemore = response.games().getFirst();
        assertThat(onemore.liveCount()).isNull();
        assertThat(onemore.capacity()).isNull();
    }

    @Test
    @DisplayName("저장소가 준 순서대로 카드를 돌려준다")
    void getGamesKeepsOrder() {
        // given
        given(gameRepository.findAllWithTagsOrderBySortOrder()).willReturn(List.of(
                GameFixture.playableGame("onemore", 0),
                GameFixture.comingSoonGame("game2", 1)
        ));
        GameService gameService = new GameService(gameRepository, List.of());

        // when
        GameListResponse response = gameService.getGames();

        // then
        assertThat(response.games()).extracting(GameResponse::code).containsExactly("onemore", "game2");
    }
}
