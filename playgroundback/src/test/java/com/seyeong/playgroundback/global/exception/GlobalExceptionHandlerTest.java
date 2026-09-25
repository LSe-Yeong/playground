package com.seyeong.playgroundback.global.exception;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.seyeong.playgroundback.global.response.ApiResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("성공 응답은 success 와 data 만 담는다")
    void successResponse() throws Exception {
        mockMvc.perform(get("/test/success"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("두더지4821"))
                .andExpect(jsonPath("$.error").doesNotExist());
    }

    @Test
    @DisplayName("비즈니스 예외는 에러 코드의 상태와 문구로 응답한다")
    void businessException() throws Exception {
        mockMvc.perform(get("/test/business"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data").doesNotExist())
                .andExpect(jsonPath("$.error.code").value("ALREADY_IN_ROOM"))
                .andExpect(jsonPath("$.error.message").value("이미 다른 곳에 있습니다"));
    }

    @Test
    @DisplayName("비즈니스 예외에 문구를 따로 주면 그 문구로 응답한다")
    void businessExceptionWithCustomMessage() throws Exception {
        mockMvc.perform(get("/test/business-custom"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.message").value("빨강 팀 2명 · 파랑 팀 1명"));
    }

    @Test
    @DisplayName("요청 값 검증에 실패하면 VALIDATION_ERROR 로 응답한다")
    void validationError() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("JSON 형식이 깨지면 INVALID_REQUEST 로 응답한다")
    void invalidRequest() throws Exception {
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_REQUEST"));
    }

    @Test
    @DisplayName("예상하지 못한 예외는 INTERNAL_ERROR 로 응답한다")
    void unexpectedException() throws Exception {
        mockMvc.perform(get("/test/unexpected"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error.code").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.error.message").value("서버 오류가 발생했습니다"));
    }

    @RestController
    static class TestController {

        @GetMapping("/test/success")
        ApiResponse<TestRequest> success() {
            return ApiResponse.success(new TestRequest("두더지4821"));
        }

        @GetMapping("/test/business")
        void business() {
            throw new BusinessException(CommonErrorCode.ALREADY_IN_ROOM);
        }

        @GetMapping("/test/business-custom")
        void businessCustom() {
            throw new BusinessException(CommonErrorCode.VALIDATION_ERROR, "빨강 팀 2명 · 파랑 팀 1명");
        }

        @PostMapping("/test/validation")
        void validation(@Valid @RequestBody TestRequest request) {
        }

        @GetMapping("/test/unexpected")
        void unexpected() {
            throw new IllegalStateException("boom");
        }
    }

    record TestRequest(@NotBlank String name) {
    }
}
