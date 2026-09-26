package com.seyeong.playgroundback.plaza.service;

import com.seyeong.playgroundback.game.service.LiveCount;
import com.seyeong.playgroundback.game.service.LiveCountProvider;
import com.seyeong.playgroundback.plaza.domain.PlazaRules;
import com.seyeong.playgroundback.plaza.repository.PlazaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** 허브 카드에 지금 몇 명 있는지 띄운다 (P-4, P-22). GET /games 의 liveCount 로 나간다. */
@Component
@RequiredArgsConstructor
public class PlazaLiveCountProvider implements LiveCountProvider {

    /** data.sql 의 games.code 와 같아야 한다. */
    public static final String GAME_CODE = "plaza";

    private final PlazaRepository plazaRepository;

    @Override
    public String gameCode() {
        return GAME_CODE;
    }

    @Override
    public LiveCount getLiveCount() {
        return new LiveCount(plazaRepository.count(), PlazaRules.CAPACITY);
    }
}
