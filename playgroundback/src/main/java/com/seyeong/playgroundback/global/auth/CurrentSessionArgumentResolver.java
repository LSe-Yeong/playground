package com.seyeong.playgroundback.global.auth;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.service.SessionReadService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
@RequiredArgsConstructor
public class CurrentSessionArgumentResolver implements HandlerMethodArgumentResolver {

    private final SessionReadService sessionReadService;
    private final SessionCookieFactory sessionCookieFactory;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentSession.class)
                && Session.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Session resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                   NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        String sessionKey = sessionCookieFactory.readKey(request)
                .orElseThrow(() -> new BusinessException(CommonErrorCode.SESSION_REQUIRED));
        return sessionReadService.getSession(sessionKey);
    }
}
