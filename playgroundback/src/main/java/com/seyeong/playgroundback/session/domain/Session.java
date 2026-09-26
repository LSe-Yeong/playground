package com.seyeong.playgroundback.session.domain;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import java.time.Duration;
import java.time.Instant;
import lombok.Getter;

/**
 * 접속 중인 사람 (ERD sessions). 로그인이 없으므로 사용자 테이블을 대신하며 서버 메모리에만 있다.
 * REST 요청 스레드와 소켓 스레드가 동시에 건드리므로 바뀌는 값은 volatile 로 둔다.
 */
@Getter
public class Session {

    private final long id;
    private final String sessionKey;
    private final Instant issuedAt;
    private volatile String nickname;
    private volatile String avatar;
    private volatile boolean socketConnected;
    private volatile Instant lastSeenAt;

    public Session(long id, String sessionKey, String nickname, String avatar, Instant now) {
        validateAvatar(avatar);
        this.id = id;
        this.sessionKey = sessionKey;
        this.issuedAt = now;
        this.nickname = nickname.strip();
        this.avatar = avatar;
        this.lastSeenAt = now;
    }

    /** 바꿀 값만 넘긴다. null 이면 그대로 둔다. */
    public synchronized void updateProfile(String nickname, String avatar) {
        if (avatar != null) {
            validateAvatar(avatar);
            this.avatar = avatar;
        }
        if (nickname != null) {
            this.nickname = nickname.strip();
        }
    }

    public void connectSocket(Instant now) {
        this.socketConnected = true;
        this.lastSeenAt = now;
    }

    public void touch(Instant now) {
        this.lastSeenAt = now;
    }

    /**
     * 세션 TTL 스위퍼의 판정.
     * 소켓이 붙은 적 없으면 발급 시각부터, 붙어 있으면 마지막 신호부터 잰다.
     */
    public boolean isExpired(Instant now, Duration connectTimeout, Duration heartbeatTimeout) {
        if (!socketConnected) {
            return now.isAfter(issuedAt.plus(connectTimeout));
        }
        return now.isAfter(lastSeenAt.plus(heartbeatTimeout));
    }

    private static void validateAvatar(String avatar) {
        if (!Avatars.isSupported(avatar)) {
            throw new BusinessException(CommonErrorCode.VALIDATION_ERROR);
        }
    }
}
