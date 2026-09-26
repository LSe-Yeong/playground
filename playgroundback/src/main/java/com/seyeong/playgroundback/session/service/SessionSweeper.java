package com.seyeong.playgroundback.session.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SessionSweeper {

    private final SessionCommandService sessionCommandService;

    @Scheduled(
            initialDelayString = "${playground.session.sweep-interval}",
            fixedDelayString = "${playground.session.sweep-interval}"
    )
    public void sweep() {
        sessionCommandService.expireStaleSessions();
    }
}
