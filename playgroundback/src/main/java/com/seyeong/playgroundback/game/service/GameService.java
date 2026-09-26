package com.seyeong.playgroundback.game.service;

import com.seyeong.playgroundback.game.dto.GameListResponse;
import com.seyeong.playgroundback.game.dto.GameResponse;
import com.seyeong.playgroundback.game.repository.GameRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GameService {

    private final GameRepository gameRepository;
    private final Map<String, LiveCountProvider> liveCountProviders;

    public GameService(GameRepository gameRepository, List<LiveCountProvider> liveCountProviders) {
        this.gameRepository = gameRepository;
        this.liveCountProviders = liveCountProviders.stream()
                .collect(Collectors.toUnmodifiableMap(LiveCountProvider::gameCode, Function.identity()));
    }

    public GameListResponse getGames() {
        List<GameResponse> games = gameRepository.findAllWithTagsOrderBySortOrder().stream()
                .map(game -> GameResponse.of(game, findLiveCount(game.getCode())))
                .toList();
        return new GameListResponse(games);
    }

    private LiveCount findLiveCount(String gameCode) {
        LiveCountProvider provider = liveCountProviders.get(gameCode);
        if (provider == null) {
            return null;
        }
        return provider.getLiveCount();
    }
}
