package com.seyeong.playgroundback.plaza.dto;

import com.seyeong.playgroundback.plaza.domain.PlazaTrack;

/** 고를 수 있는 곡. srcUrl 은 지금 나오는 곡에만 싣는다 — 나머지는 고를 때 받아도 늦지 않다. */
public record PlazaTrackResponse(long trackId, String title, String mood, int durationSec) {

    public static PlazaTrackResponse from(PlazaTrack track) {
        return new PlazaTrackResponse(track.getId(), track.getTitle(), track.getMood(), track.getDurationSec());
    }
}
