package com.seyeong.playgroundback.plaza.fixture;

import com.seyeong.playgroundback.plaza.domain.PlazaTrack;
import com.seyeong.playgroundback.session.domain.Session;
import java.time.Instant;
import org.springframework.test.util.ReflectionTestUtils;

public final class PlazaFixture {

    private PlazaFixture() {
    }

    public static Session session(long id, Instant now) {
        return new Session(id, "s_key" + id, "두더지" + id, "⛏", now);
    }

    public static PlazaTrack track(String code, String title, int sortOrder) {
        return PlazaTrack.builder()
                .code(code)
                .title(title)
                .mood("Calm")
                .srcUrl("https://cdn.playground.app/audio/" + code + ".mp3")
                .durationSec(132)
                .sortOrder(sortOrder)
                .build();
    }

    /** 곡을 저장하지 않고 쓰는 테스트에는 id 가 있어야 한다 — trackId 로 주고받기 때문이다. */
    public static PlazaTrack track(long id, String code, String title, int sortOrder) {
        PlazaTrack track = track(code, title, sortOrder);
        ReflectionTestUtils.setField(track, "id", id);
        return track;
    }
}
