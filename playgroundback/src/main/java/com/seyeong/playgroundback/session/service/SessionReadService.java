package com.seyeong.playgroundback.session.service;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.session.domain.Session;
import com.seyeong.playgroundback.session.repository.SessionRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/** 세션은 메모리에만 있어 트랜잭션을 걸지 않는다. */
@Service
@RequiredArgsConstructor
public class SessionReadService {

    private final SessionRepository sessionRepository;

    public Optional<Session> findSession(String sessionKey) {
        return sessionRepository.findBySessionKey(sessionKey);
    }

    public Session getSession(String sessionKey) {
        return sessionRepository.findBySessionKey(sessionKey)
                .orElseThrow(() -> new BusinessException(CommonErrorCode.SESSION_INVALID));
    }
}
