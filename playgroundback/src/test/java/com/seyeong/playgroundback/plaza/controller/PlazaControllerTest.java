package com.seyeong.playgroundback.plaza.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.seyeong.playgroundback.global.auth.SessionCookieFactory;
import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.plaza.dto.PlazaMemberResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaStateResponse;
import com.seyeong.playgroundback.plaza.exception.PlazaErrorCode;
import com.seyeong.playgroundback.plaza.service.PlazaCommandService;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.service.SessionReadService;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PlazaController.class)
@Import(SessionCookieFactory.class)
@EnableConfigurationProperties(PlaygroundProperties.class)
class PlazaControllerTest {

    private static final String CONTEXT_PATH = "/pg/api";
    private static final String SESSION_KEY = "s_9f3aQm2x";
    private static final Instant NOW = Instant.parse("2026-09-25T10:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PlazaCommandService plazaCommandService;

    @MockitoBean
    private SessionReadService sessionReadService;

    @Test
    @DisplayName("입장하면 광장 전체 상태를 돌려준다")
    void enter() throws Exception {
        // given
        Session session = new Session(7L, SESSION_KEY, "두더지4821", "⛏", NOW);
        given(sessionReadService.getSession(SESSION_KEY)).willReturn(session);
        given(plazaCommandService.enter(session)).willReturn(new PlazaStateResponse(
                20,
                7L,
                List.of(new PlazaMemberResponse(7L, "두더지4821", "⛏", "red", 42.5, 71.2, 1, null)),
                null,
                List.of(),
                List.of(),
                Instant.parse("2026-09-25T10:10:00Z"),
                List.of("red", "blue")
        ));

        // when & then
        mockMvc.perform(post(CONTEXT_PATH + "/plaza/enter").contextPath(CONTEXT_PATH)
                        .cookie(new Cookie("sessionKey", SESSION_KEY)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.capacity").value(20))
                .andExpect(jsonPath("$.data.meId").value(7))
                .andExpect(jsonPath("$.data.members[0].color").value("red"))
                .andExpect(jsonPath("$.data.members[0].riding").isEmpty())
                .andExpect(jsonPath("$.data.music").isEmpty())
                .andExpect(jsonPath("$.data.chatResetAt").exists());
    }

    @Test
    @DisplayName("정원이 차 있으면 409 로 거절한다")
    void enterWhenFull() throws Exception {
        // given
        Session session = new Session(7L, SESSION_KEY, "두더지4821", "⛏", NOW);
        given(sessionReadService.getSession(SESSION_KEY)).willReturn(session);
        willThrow(new BusinessException(PlazaErrorCode.PLAZA_FULL))
                .given(plazaCommandService).enter(any(Session.class));

        // when & then
        mockMvc.perform(post(CONTEXT_PATH + "/plaza/enter").contextPath(CONTEXT_PATH)
                        .cookie(new Cookie("sessionKey", SESSION_KEY)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("PLAZA_FULL"))
                .andExpect(jsonPath("$.error.message").value("놀이터 정원(20명)이 찼습니다"));
    }

    @Test
    @DisplayName("세션 쿠키가 없으면 입장할 수 없다")
    void enterWithoutCookie() throws Exception {
        mockMvc.perform(post(CONTEXT_PATH + "/plaza/enter").contextPath(CONTEXT_PATH))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("SESSION_REQUIRED"));
    }
}
