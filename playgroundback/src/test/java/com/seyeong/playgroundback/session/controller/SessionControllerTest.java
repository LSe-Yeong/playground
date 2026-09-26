package com.seyeong.playgroundback.session.controller;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.seyeong.playgroundback.global.auth.SessionCookieFactory;
import com.seyeong.playgroundback.global.config.PlaygroundProperties;
import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.service.SessionCommandService;
import com.seyeong.playgroundback.session.service.SessionIssue;
import com.seyeong.playgroundback.session.service.SessionReadService;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SessionController.class)
@Import(SessionCookieFactory.class)
@EnableConfigurationProperties(PlaygroundProperties.class)
class SessionControllerTest {

    private static final String CONTEXT_PATH = "/pg/api";
    private static final String SESSION_KEY = "s_9f3aQm2x";
    private static final Instant NOW = Instant.parse("2026-09-25T10:00:00Z");

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SessionCommandService sessionCommandService;

    @MockitoBean
    private SessionReadService sessionReadService;

    @Test
    @DisplayName("세션이 없으면 201 과 함께 세션 쿠키를 내려준다")
    void issueNewSession() throws Exception {
        // given
        Session session = new Session(1L, SESSION_KEY, "두더지4821", "⛏", NOW);
        given(sessionCommandService.issueSession(null, "두더지4821", "⛏"))
                .willReturn(new SessionIssue(session, true));

        // when & then
        mockMvc.perform(post(CONTEXT_PATH + "/sessions").contextPath(CONTEXT_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "두더지4821", "avatar": "⛏" }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nickname").value("두더지4821"))
                .andExpect(jsonPath("$.data.avatar").value("⛏"))
                .andExpect(jsonPath("$.data.sessionKey").doesNotExist())
                .andExpect(cookie().value("sessionKey", SESSION_KEY))
                .andExpect(cookie().httpOnly("sessionKey", true))
                .andExpect(cookie().path("sessionKey", CONTEXT_PATH))
                .andExpect(cookie().sameSite("sessionKey", "Lax"));
    }

    @Test
    @DisplayName("쿠키에 살아 있는 세션이 있으면 새로 만들지 않고 200 으로 돌려준다")
    void reuseExistingSession() throws Exception {
        // given — 탭을 하나 더 열어 다시 호출한 상황
        Session session = new Session(1L, SESSION_KEY, "두더지4821", "⛏", NOW);
        given(sessionCommandService.issueSession(SESSION_KEY, "두더지4821", "⛏"))
                .willReturn(new SessionIssue(session, false));

        // when & then
        mockMvc.perform(post(CONTEXT_PATH + "/sessions").contextPath(CONTEXT_PATH)
                        .cookie(new Cookie("sessionKey", SESSION_KEY))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "두더지4821", "avatar": "⛏" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("두더지4821"))
                .andExpect(cookie().doesNotExist("sessionKey"));
    }

    @Test
    @DisplayName("이름이 비어 있으면 VALIDATION_ERROR 로 거절한다")
    void createSessionWithBlankNickname() throws Exception {
        mockMvc.perform(post(CONTEXT_PATH + "/sessions").contextPath(CONTEXT_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": " ", "avatar": "⛏" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("이름이 20자를 넘으면 VALIDATION_ERROR 로 거절한다")
    void createSessionWithTooLongNickname() throws Exception {
        mockMvc.perform(post(CONTEXT_PATH + "/sessions").contextPath(CONTEXT_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "가나다라마바사아자차카타파하가나다라마바사", "avatar": "⛏" }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("바꿀 필드만 보내면 그 필드만 바뀐 프로필을 돌려준다")
    void updateMySession() throws Exception {
        // given
        Session session = new Session(1L, SESSION_KEY, "두더지4821", "⛏", NOW);
        given(sessionReadService.getSession(SESSION_KEY)).willReturn(session);
        given(sessionCommandService.updateProfile(session, "곡괭이1007", null))
                .willReturn(new Session(1L, SESSION_KEY, "곡괭이1007", "⛏", NOW));

        // when & then
        mockMvc.perform(patch(CONTEXT_PATH + "/sessions/me").contextPath(CONTEXT_PATH)
                        .cookie(new Cookie("sessionKey", SESSION_KEY))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "곡괭이1007" }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.nickname").value("곡괭이1007"))
                .andExpect(jsonPath("$.data.avatar").value("⛏"))
                .andExpect(jsonPath("$.data.sessionKey").doesNotExist());
    }

    @Test
    @DisplayName("세션 쿠키 없이 프로필을 바꾸면 SESSION_REQUIRED 로 거절한다")
    void updateWithoutCookie() throws Exception {
        mockMvc.perform(patch(CONTEXT_PATH + "/sessions/me").contextPath(CONTEXT_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "곡괭이1007" }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("SESSION_REQUIRED"));
    }

    @Test
    @DisplayName("서버에 없는 세션으로 프로필을 바꾸면 SESSION_INVALID 로 거절한다")
    void updateWithInvalidSession() throws Exception {
        // given
        given(sessionReadService.getSession(SESSION_KEY))
                .willThrow(new BusinessException(CommonErrorCode.SESSION_INVALID));

        // when & then
        mockMvc.perform(patch(CONTEXT_PATH + "/sessions/me").contextPath(CONTEXT_PATH)
                        .cookie(new Cookie("sessionKey", SESSION_KEY))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "곡괭이1007" }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error.code").value("SESSION_INVALID"));
    }

    @Test
    @DisplayName("보낸 이름이 공백뿐이면 VALIDATION_ERROR 로 거절한다")
    void updateWithBlankNickname() throws Exception {
        // given
        given(sessionReadService.getSession(SESSION_KEY))
                .willReturn(new Session(1L, SESSION_KEY, "두더지4821", "⛏", NOW));

        // when & then
        mockMvc.perform(patch(CONTEXT_PATH + "/sessions/me").contextPath(CONTEXT_PATH)
                        .cookie(new Cookie("sessionKey", SESSION_KEY))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "nickname": "  " }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
