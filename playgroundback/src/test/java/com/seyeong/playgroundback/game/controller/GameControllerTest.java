package com.seyeong.playgroundback.game.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.seyeong.playgroundback.game.dto.GameListResponse;
import com.seyeong.playgroundback.game.dto.GameResponse;
import com.seyeong.playgroundback.game.service.GameService;
import com.seyeong.playgroundback.global.auth.SessionCookieFactory;
import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import com.seyeong.playgroundback.session.service.SessionReadService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GameController.class)
@Import(SessionCookieFactory.class)
@EnableConfigurationProperties(PlaygroundProperties.class)
class GameControllerTest {

    private static final String CONTEXT_PATH = "/pg/api";

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private GameService gameService;

    @MockitoBean
    private SessionReadService sessionReadService;

    @Test
    @DisplayName("허용된 출처의 사전 요청에는 쿠키를 허용하는 CORS 헤더를 내려준다")
    void corsPreflightFromAllowedOrigin() throws Exception {
        mockMvc.perform(options(CONTEXT_PATH + "/games").contextPath(CONTEXT_PATH)
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("허용되지 않은 출처는 CORS 로 막는다")
    void corsPreflightFromForeignOrigin() throws Exception {
        mockMvc.perform(options(CONTEXT_PATH + "/games").contextPath(CONTEXT_PATH)
                        .header("Origin", "https://evil.example")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("쿠키를 쓰므로 출처에 와일드카드를 내려주지 않는다")
    void corsNeverReturnsWildcardOrigin() throws Exception {
        mockMvc.perform(get(CONTEXT_PATH + "/games").contextPath(CONTEXT_PATH)
                        .header("Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    @DisplayName("카드 목록을 정렬된 순서로 조회한다")
    void getGames() throws Exception {
        // given
        given(gameService.getGames()).willReturn(new GameListResponse(List.of(
                new GameResponse("plaza", "놀이터", "Plaza",
                        "캐릭터를 움직이며 다른 사람들과 이야기하는 공간. 게임이 아니라 그냥 모이는 곳이다",
                        null, 1, 20, "자유", true, List.of("소통", "자유 이동", "채팅"), 8, 20),
                new GameResponse("onemore", "한번더", "OneMoreTime",
                        "주사위 4개로 11개의 갱도를 파내려가, 가장 깊은 곳의 보물 3개를 먼저 찾는 사람이 이긴다",
                        "https://cdn.playground.app/games/omt-thumb.webp", 2, 6, "15~20분", true,
                        List.of("주사위", "운과 배짱", "쉬운 규칙"), null, null),
                new GameResponse("game2", "게임 2", "Coming Soon", "다음 게임을 준비하고 있습니다",
                        "https://cdn.playground.app/games/coming-soon.webp", 0, 0, null, false,
                        List.of(), null, null)
        )));

        // when & then
        mockMvc.perform(get(CONTEXT_PATH + "/games").contextPath(CONTEXT_PATH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.games[0].code").value("plaza"))
                .andExpect(jsonPath("$.data.games[0].liveCount").value(8))
                .andExpect(jsonPath("$.data.games[1].liveCount").isEmpty())
                .andExpect(jsonPath("$.data.games[2].playable").value(false));
    }
}
