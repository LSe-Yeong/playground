package com.seyeong.playgroundback.game.controller;

import com.seyeong.playgroundback.game.dto.GameListResponse;
import com.seyeong.playgroundback.game.service.GameService;
import com.seyeong.playgroundback.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    @GetMapping
    public ApiResponse<GameListResponse> getGames() {
        return ApiResponse.success(gameService.getGames());
    }
}
