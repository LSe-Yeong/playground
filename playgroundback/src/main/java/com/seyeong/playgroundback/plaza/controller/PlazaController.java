package com.seyeong.playgroundback.plaza.controller;

import com.seyeong.playgroundback.global.auth.CurrentSession;
import com.seyeong.playgroundback.global.response.ApiResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaStateResponse;
import com.seyeong.playgroundback.plaza.service.PlazaCommandService;
import com.seyeong.playgroundback.session.domain.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 놀이터는 입장만 REST 다. 나가기는 소켓 plaza.leave 이거나 연결이 끊기는 것으로 처리한다 (0-4).
 * 광장 인원도 따로 두지 않고 허브의 GET /games 가 실어 보낸다.
 */
@RestController
@RequestMapping("/plaza")
@RequiredArgsConstructor
public class PlazaController {

    private final PlazaCommandService plazaCommandService;

    @PostMapping("/enter")
    public ApiResponse<PlazaStateResponse> enter(@CurrentSession Session session) {
        return ApiResponse.success(plazaCommandService.enter(session));
    }
}
