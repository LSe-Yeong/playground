package com.seyeong.playgroundback.global.auth;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 세션 쿠키로 찾은 현재 세션을 주입한다 (Auth Required: Yes).
 * 쿠키가 없으면 SESSION_REQUIRED, 서버에 없으면 SESSION_INVALID.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentSession {
}
