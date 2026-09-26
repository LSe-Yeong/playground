package com.seyeong.playgroundback.session.controller;

import com.seyeong.playgroundback.global.auth.CurrentSession;
import com.seyeong.playgroundback.global.auth.SessionCookieFactory;
import com.seyeong.playgroundback.global.response.ApiResponse;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.dto.CreateSessionRequest;
import com.seyeong.playgroundback.session.dto.SessionResponse;
import com.seyeong.playgroundback.session.dto.UpdateSessionRequest;
import com.seyeong.playgroundback.session.service.SessionCommandService;
import com.seyeong.playgroundback.session.service.SessionIssue;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sessions")
@RequiredArgsConstructor
public class SessionController {

    private final SessionCommandService sessionCommandService;
    private final SessionCookieFactory sessionCookieFactory;

    /**
     * 세션을 보장한다. 이미 살아 있는 세션이 있으면 200 으로 그것을 돌려주고,
     * 없을 때만 201 과 함께 새 쿠키를 내려준다. 클라이언트는 쿠키(HttpOnly)를 읽을 수 없어
     * 세션이 있는지 스스로 알 수 없으므로, 진입할 때마다 그냥 호출하면 된다.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SessionResponse>> issueSession(
            @Valid @RequestBody CreateSessionRequest request,
            HttpServletRequest httpRequest
    ) {
        SessionIssue issued = sessionCommandService.issueSession(
                sessionCookieFactory.readKey(httpRequest).orElse(null),
                request.nickname(),
                request.avatar()
        );
        ApiResponse<SessionResponse> body = ApiResponse.success(SessionResponse.from(issued.session()));
        if (!issued.created()) {
            return ResponseEntity.ok(body);
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE,
                        sessionCookieFactory.create(issued.session().getSessionKey(),
                                httpRequest.getContextPath()).toString())
                .body(body);
    }

    @PatchMapping("/me")
    public ApiResponse<SessionResponse> updateMySession(
            @CurrentSession Session session,
            @Valid @RequestBody UpdateSessionRequest request
    ) {
        Session updated = sessionCommandService.updateProfile(session, request.nickname(), request.avatar());
        return ApiResponse.success(SessionResponse.from(updated));
    }
}
