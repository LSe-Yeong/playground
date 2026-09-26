package com.seyeong.playgroundback.plaza.service;

import com.seyeong.playgroundback.plaza.domain.PlazaMessageType;
import com.seyeong.playgroundback.plaza.domain.PlazaMusic;
import com.seyeong.playgroundback.plaza.domain.PlazaTrack;
import com.seyeong.playgroundback.plaza.dto.PlazaMusicResponse;
import com.seyeong.playgroundback.plaza.repository.PlazaRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicReference;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

/**
 * 광장 음악 (P-15 ~ P-18, P-25).
 *
 * <p>곡이 끝났다고 클라이언트가 알리지 않는다 — 여러 명이 동시에 알리게 된다.
 * 서버가 곡 길이만큼 타이머를 걸고 스스로 다음 곡으로 넘긴다.
 *
 * <p>곡이 바뀌면 이전 타이머를 반드시 취소해야 한다. 취소가 늦어 이미 실행에 들어간 타이머는
 * 자기 세대의 곡이 아직 나오는지 확인하고 아니면 아무것도 하지 않는다.
 */
@Component
@RequiredArgsConstructor
public class PlazaMusicPlayer {

    private static final Logger log = LoggerFactory.getLogger(PlazaMusicPlayer.class);

    private final PlazaRepository plazaRepository;
    private final PlazaReadService plazaReadService;
    private final PlazaBroadcaster plazaBroadcaster;
    private final TaskScheduler taskScheduler;
    private final Clock clock;

    private final AtomicReference<ScheduledFuture<?>> endTimer = new AtomicReference<>();

    public void pick(long trackId) {
        play(plazaReadService.getTrack(trackId));
    }

    public void stop() {
        cancelTimer();
        plazaRepository.stopMusic();
        plazaBroadcaster.broadcast(PlazaMessageType.Event.MUSIC, null);
    }

    /**
     * 마지막 사람이 나갔을 때 (P-25). 광장은 사라지지 않지만 아무도 없는 곳에 음악을 틀어 둘 이유가 없다.
     * 들을 사람이 없으니 알리지 않는다. 다음 입장자는 music 이 null 인 상태로 들어온다.
     */
    public void stopWhenEmpty() {
        if (!plazaRepository.isEmpty()) {
            return;
        }
        cancelTimer();
        plazaRepository.stopMusic();
    }

    private void play(PlazaTrack track) {
        Instant startedAt = Instant.now(clock);
        PlazaMusic music = plazaRepository.startMusic(track.getId(), startedAt);
        scheduleEnd(music.generation(), startedAt.plusSeconds(track.getDurationSec()));
        plazaBroadcaster.broadcast(PlazaMessageType.Event.MUSIC, PlazaMusicResponse.of(track, startedAt));
    }

    private void scheduleEnd(long generation, Instant endAt) {
        ScheduledFuture<?> previous = endTimer.getAndSet(taskScheduler.schedule(() -> advance(generation), endAt));
        cancel(previous);
    }

    private void advance(long generation) {
        try {
            Optional<PlazaMusic> playing = plazaRepository.findMusicOfGeneration(generation);
            if (playing.isEmpty()) {
                return;
            }
            if (plazaRepository.isEmpty()) {
                stopWhenEmpty();
                return;
            }
            plazaReadService.findNextTrack(playing.get().trackId()).ifPresentOrElse(this::play, this::stop);
        } catch (RuntimeException exception) {
            log.error("다음 곡으로 넘기지 못했습니다. generation={}", generation, exception);
        }
    }

    private void cancelTimer() {
        cancel(endTimer.getAndSet(null));
    }

    /** 이미 실행 중인 타이머는 끊지 않는다. 세대 확인이 있어 스스로 물러난다. */
    private static void cancel(ScheduledFuture<?> future) {
        if (future != null) {
            future.cancel(false);
        }
    }
}
