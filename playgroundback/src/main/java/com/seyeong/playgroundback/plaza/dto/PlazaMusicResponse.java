package com.seyeong.playgroundback.plaza.dto;

import com.seyeong.playgroundback.plaza.domain.PlazaTrack;
import java.time.Instant;

/**
 * 지금 나오는 곡. 꺼져 있으면 이 payload 자리에 null 이 간다.
 * 서버는 startedAt 만 주고 재생 위치는 각자 계산한다 (P-17).
 */
public record PlazaMusicResponse(
        long trackId,
        String title,
        String mood,
        String srcUrl,
        int durationSec,
        Instant startedAt
) {

    public static PlazaMusicResponse of(PlazaTrack track, Instant startedAt) {
        return new PlazaMusicResponse(
                track.getId(),
                track.getTitle(),
                track.getMood(),
                track.getSrcUrl(),
                track.getDurationSec(),
                startedAt
        );
    }
}
