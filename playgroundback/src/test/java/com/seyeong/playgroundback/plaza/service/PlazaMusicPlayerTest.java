package com.seyeong.playgroundback.plaza.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.seyeong.playgroundback.plaza.domain.PlazaMember;
import com.seyeong.playgroundback.plaza.domain.PlazaMessageType;
import com.seyeong.playgroundback.plaza.domain.PlazaTrack;
import com.seyeong.playgroundback.plaza.dto.PlazaMusicResponse;
import com.seyeong.playgroundback.plaza.fixture.MutableClock;
import com.seyeong.playgroundback.plaza.fixture.PlazaFixture;
import com.seyeong.playgroundback.plaza.repository.PlazaRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ScheduledFuture;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.scheduling.TaskScheduler;

class PlazaMusicPlayerTest {

    private static final Instant NOW = Instant.parse("2026-09-25T10:00:00Z");

    private static final PlazaTrack FIRST = PlazaFixture.track(1L, "energetic", "신나는 하루", 0);
    private static final PlazaTrack SECOND = PlazaFixture.track(2L, "calm", "잔잔한 오후", 1);
    private static final PlazaTrack LAST = PlazaFixture.track(3L, "epic", "웅장한 광장", 2);

    private PlazaRepository plazaRepository;
    private PlazaReadService plazaReadService;
    private PlazaBroadcaster plazaBroadcaster;
    private PlazaMusicPlayer plazaMusicPlayer;

    /** 132초를 기다릴 수 없으니 타이머가 맡긴 일을 붙잡아 두고 원할 때 태운다. */
    private final List<Runnable> scheduled = new ArrayList<>();

    @BeforeEach
    void setUp() {
        plazaRepository = new PlazaRepository();
        plazaReadService = mock(PlazaReadService.class);
        plazaBroadcaster = mock(PlazaBroadcaster.class);
        TaskScheduler taskScheduler = mock(TaskScheduler.class);
        given(taskScheduler.schedule(any(Runnable.class), any(Instant.class))).willAnswer(invocation -> {
            scheduled.add(invocation.getArgument(0));
            return mock(ScheduledFuture.class);
        });
        plazaMusicPlayer = new PlazaMusicPlayer(
                plazaRepository, plazaReadService, plazaBroadcaster, taskScheduler, new MutableClock(NOW));

        given(plazaReadService.getTrack(1L)).willReturn(FIRST);
        given(plazaReadService.getTrack(2L)).willReturn(SECOND);
        given(plazaReadService.getTrack(3L)).willReturn(LAST);
    }

    @Test
    @DisplayName("곡을 걸면 시작 시각과 함께 알리고 종료 타이머를 건다")
    void pickStartsTrack() {
        // when
        plazaMusicPlayer.pick(2L);

        // then
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(plazaBroadcaster).broadcast(eq(PlazaMessageType.Event.MUSIC), payload.capture());
        assertThat((PlazaMusicResponse) payload.getValue())
                .isEqualTo(PlazaMusicResponse.of(SECOND, NOW));
        assertThat(plazaRepository.findMusic()).get()
                .extracting("trackId", "startedAt").containsExactly(2L, NOW);
        assertThat(scheduled).hasSize(1);
    }

    @Test
    @DisplayName("곡이 끝나면 sort_order 다음 곡으로 넘어간다")
    void advancesToNextTrack() {
        // given
        joinSomeone();
        plazaMusicPlayer.pick(1L);
        given(plazaReadService.findNextTrack(1L)).willReturn(Optional.of(SECOND));

        // when
        scheduled.getFirst().run();

        // then
        assertThat(plazaRepository.findMusic()).get().extracting("trackId").isEqualTo(2L);
    }

    @Test
    @DisplayName("이미 다른 곡으로 바뀌었으면 지난 타이머는 아무것도 하지 않는다")
    void staleTimerDoesNothing() {
        // given
        joinSomeone();
        plazaMusicPlayer.pick(1L);
        Runnable staleTimer = scheduled.getFirst();
        plazaMusicPlayer.pick(3L);

        // when
        staleTimer.run();

        // then
        assertThat(plazaRepository.findMusic()).get().extracting("trackId").isEqualTo(3L);
        verify(plazaReadService, never()).findNextTrack(1L);
    }

    @Test
    @DisplayName("광장이 비면 곡이 끝나도 넘기지 않고 음악을 끈다")
    void stopsWhenPlazaIsEmpty() {
        // given - 아무도 들어오지 않은 광장
        plazaMusicPlayer.pick(1L);

        // when
        scheduled.getFirst().run();

        // then
        assertThat(plazaRepository.findMusic()).isEmpty();
        verify(plazaReadService, never()).findNextTrack(1L);
    }

    @Test
    @DisplayName("사람이 남아 있으면 마지막 사람이 나간 것이 아니므로 음악을 끄지 않는다")
    void keepsPlayingWhileSomeoneRemains() {
        // given
        joinSomeone();
        plazaMusicPlayer.pick(1L);

        // when
        plazaMusicPlayer.stopWhenEmpty();

        // then
        assertThat(plazaRepository.findMusic()).isPresent();
    }

    @Test
    @DisplayName("음악을 끄면 payload 없이 알린다")
    void stopAnnouncesNull() {
        plazaMusicPlayer.pick(1L);

        plazaMusicPlayer.stop();

        assertThat(plazaRepository.findMusic()).isEmpty();
        verify(plazaBroadcaster).broadcast(PlazaMessageType.Event.MUSIC, null);
    }

    private void joinSomeone() {
        plazaRepository.save(new PlazaMember(
                plazaRepository.nextMemberId(), 1L, "두더지4821", "⛏", "red", 50, 75, NOW));
    }
}
