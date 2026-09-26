package com.seyeong.playgroundback.session.service;

import com.seyeong.playgroundback.session.domain.Session;

/**
 * 세션 발급 결과.
 *
 * @param created 이번에 새로 만들었으면 true. 기존 세션을 그대로 쓴 경우 false 이고,
 *                이때는 쿠키를 다시 내려줄 필요가 없다.
 */
public record SessionIssue(Session session, boolean created) {
}
