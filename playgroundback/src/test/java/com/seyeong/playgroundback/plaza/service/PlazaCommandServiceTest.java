package com.seyeong.playgroundback.plaza.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.plaza.domain.PlazaLeaveReason;
import com.seyeong.playgroundback.plaza.domain.PlazaMember;
import com.seyeong.playgroundback.plaza.domain.PlazaMessageType;
import com.seyeong.playgroundback.plaza.domain.PlazaRules;
import com.seyeong.playgroundback.plaza.domain.PlazaSpot;
import com.seyeong.playgroundback.plaza.dto.PlazaChatCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaColorCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaMoveCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaMovesResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaMusicPickCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaRideCommand;
import com.seyeong.playgroundback.plaza.exception.PlazaErrorCode;
import com.seyeong.playgroundback.plaza.fixture.MutableClock;
import com.seyeong.playgroundback.plaza.fixture.PlazaFixture;
import com.seyeong.playgroundback.plaza.repository.PlazaRepository;
import com.seyeong.playgroundback.session.domain.Session;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PlazaCommandServiceTest {

    private static final Instant NOW = Instant.parse("2026-09-25T10:00:00Z");

    private PlazaRepository plazaRepository;
    private PlazaBroadcaster plazaBroadcaster;
    private PlazaMusicPlayer plazaMusicPlayer;
    private MutableClock clock;
    private PlazaCommandService plazaCommandService;

    @BeforeEach
    void setUp() {
        plazaRepository = new PlazaRepository();
        plazaBroadcaster = mock(PlazaBroadcaster.class);
        plazaMusicPlayer = mock(PlazaMusicPlayer.class);
        clock = new MutableClock(NOW);
        plazaCommandService = new PlazaCommandService(
                plazaRepository, mock(PlazaReadService.class), plazaBroadcaster, plazaMusicPlayer, clock);
    }

    @Test
    @DisplayName("정원이 차면 입장을 거절한다")
    void enterWhenFull() {
        // given
        for (int index = 0; index < PlazaRules.CAPACITY; index++) {
            plazaCommandService.enter(PlazaFixture.session(index + 1, NOW));
        }

        // when & then
        assertThatThrownBy(() -> plazaCommandService.enter(PlazaFixture.session(99, NOW)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.PLAZA_FULL);
        assertThat(plazaRepository.count()).isEqualTo(PlazaRules.CAPACITY);
    }

    @Test
    @DisplayName("정원을 채워도 색은 한 사람에 하나씩 겹치지 않게 돌아간다")
    void everyMemberGetsOwnColor() {
        for (int index = 0; index < PlazaRules.CAPACITY; index++) {
            plazaCommandService.enter(PlazaFixture.session(index + 1, NOW));
        }

        assertThat(plazaRepository.findAll()).extracting(PlazaMember::getColorCode)
                .doesNotHaveDuplicates()
                .hasSize(PlazaRules.CAPACITY);
    }

    @Test
    @DisplayName("이미 광장에 있으면 다시 들어갈 수 없다")
    void enterTwice() {
        Session session = PlazaFixture.session(1, NOW);
        plazaCommandService.enter(session);

        assertThatThrownBy(() -> plazaCommandService.enter(session))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(CommonErrorCode.ALREADY_IN_ROOM);
    }

    @Test
    @DisplayName("광장에 없는 사람의 명령은 거절한다")
    void commandWithoutEntering() {
        Session outsider = PlazaFixture.session(1, NOW);

        assertThatThrownBy(() -> plazaCommandService.chat(outsider, new PlazaChatCommand("안녕하세요~")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.NOT_IN_PLAZA);
    }

    @Test
    @DisplayName("갈 수 없는 좌표는 거절하면서 서버가 아는 마지막 좌표를 돌려준다")
    void rejectedMoveReturnsLastKnownPosition() {
        // given
        Session session = PlazaFixture.session(1, NOW);
        PlazaMember member = enterAt(session, 50, 75);

        // when & then
        assertThatThrownBy(() -> plazaCommandService.move(session, new PlazaMoveCommand(50.0, 20.0, 0)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.OUT_OF_BOUNDS);

        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(plazaBroadcaster).sendTo(eq(session.getId()), eq(PlazaMessageType.Event.MOVES), payload.capture());
        assertThat(((PlazaMovesResponse) payload.getValue()).members())
                .containsExactly(new PlazaMovesResponse.Member(member.getId(), 50, 75, 0));
    }

    @Test
    @DisplayName("100ms 배치는 그 사이 움직인 사람만 싣고, 내보낸 뒤에는 비운다")
    void flushMovesCarriesOnlyMovedMembers() {
        // given
        Session walker = PlazaFixture.session(1, NOW);
        Session stander = PlazaFixture.session(2, NOW);
        PlazaMember moved = enterAt(walker, 40, 70);
        enterAt(stander, 60, 80);
        clock.advance(Duration.ofSeconds(1));
        plazaCommandService.move(walker, new PlazaMoveCommand(45.0, 72.0, 1));

        // when
        plazaCommandService.flushMoves();

        // then
        ArgumentCaptor<Object> payload = ArgumentCaptor.forClass(Object.class);
        verify(plazaBroadcaster).broadcast(eq(PlazaMessageType.Event.MOVES), payload.capture());
        assertThat(((PlazaMovesResponse) payload.getValue()).members())
                .containsExactly(new PlazaMovesResponse.Member(moved.getId(), 45, 72, 1));

        plazaCommandService.flushMoves();
        verify(plazaBroadcaster).broadcast(eq(PlazaMessageType.Event.MOVES), any());
    }

    @Test
    @DisplayName("한 기구에는 자리 수만큼만 탄다")
    void rideUntilSeatsRunOut() {
        // given - 시소는 자리가 둘이다
        Session first = PlazaFixture.session(1, NOW);
        Session second = PlazaFixture.session(2, NOW);
        Session third = PlazaFixture.session(3, NOW);
        enterAt(first, 64, 74);
        enterAt(second, 64, 74);
        enterAt(third, 64, 74);

        // when
        plazaCommandService.ride(first, new PlazaRideCommand("seesaw"));
        plazaCommandService.ride(second, new PlazaRideCommand("seesaw"));

        // then
        assertThatThrownBy(() -> plazaCommandService.ride(third, new PlazaRideCommand("seesaw")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.SPOT_FULL);
        assertThat(plazaRepository.findAll()).filteredOn(PlazaMember::isRiding).hasSize(2);
    }

    @Test
    @DisplayName("빈 자리는 앞에서부터 채우고, 내리면 그 자리가 다시 난다")
    void seatsAreAssignedByServer() {
        // given
        Session first = PlazaFixture.session(1, NOW);
        Session second = PlazaFixture.session(2, NOW);
        enterAt(first, 64, 74);
        enterAt(second, 64, 74);
        plazaCommandService.ride(first, new PlazaRideCommand("seesaw"));
        plazaCommandService.ride(second, new PlazaRideCommand("seesaw"));

        // when
        plazaCommandService.dismount(first);
        plazaCommandService.ride(first, new PlazaRideCommand("seesaw"));

        // then
        assertThat(plazaRepository.findBySessionId(first.getId()).orElseThrow()
                .isRidingSeat(PlazaSpot.SEESAW, 0)).isTrue();
    }

    @Test
    @DisplayName("DJ 부스는 탈 수 없다")
    void djBoothIsNotRideable() {
        Session session = PlazaFixture.session(1, NOW);
        enterAt(session, 82, 56);

        assertThatThrownBy(() -> plazaCommandService.ride(session, new PlazaRideCommand("dj")))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(CommonErrorCode.VALIDATION_ERROR);
    }

    @Test
    @DisplayName("DJ 부스에서 멀면 곡을 고를 수 없다")
    void pickMusicFarFromBooth() {
        Session session = PlazaFixture.session(1, NOW);
        enterAt(session, 10, 90);

        assertThatThrownBy(() -> plazaCommandService.pickMusic(session, new PlazaMusicPickCommand(1L)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.TOO_FAR);
        verify(plazaMusicPlayer, never()).pick(anyLong());
    }

    @Test
    @DisplayName("남이 쓰는 색은 고를 수 없다")
    void colorTakenByOther() {
        // given
        Session first = PlazaFixture.session(1, NOW);
        Session second = PlazaFixture.session(2, NOW);
        plazaCommandService.enter(first);
        plazaCommandService.enter(second);
        String taken = plazaRepository.findBySessionId(first.getId()).orElseThrow().getColorCode();

        // when & then
        assertThatThrownBy(() -> plazaCommandService.changeColor(second, new PlazaColorCommand(taken)))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(PlazaErrorCode.COLOR_TAKEN);
    }

    @Test
    @DisplayName("자기가 쓰던 색을 그대로 고르는 것은 막지 않는다")
    void keepingOwnColor() {
        Session session = PlazaFixture.session(1, NOW);
        plazaCommandService.enter(session);
        String mine = plazaRepository.findBySessionId(session.getId()).orElseThrow().getColorCode();

        plazaCommandService.changeColor(session, new PlazaColorCommand(mine));

        assertThat(plazaRepository.findBySessionId(session.getId()).orElseThrow().getColorCode()).isEqualTo(mine);
    }

    @Test
    @DisplayName("마지막 사람이 나가면 음악을 끈다")
    void musicStopsWhenPlazaEmpties() {
        Session session = PlazaFixture.session(1, NOW);
        plazaCommandService.enter(session);

        plazaCommandService.leave(session.getId(), PlazaLeaveReason.LEFT);

        assertThat(plazaRepository.isEmpty()).isTrue();
        verify(plazaMusicPlayer).stopWhenEmpty();
    }

    @Test
    @DisplayName("광장에 없던 세션이 끊겨도 나감을 알리지 않는다")
    void leaveWithoutEntering() {
        plazaCommandService.leave(99L, PlazaLeaveReason.DISCONNECTED);

        verify(plazaBroadcaster, never()).broadcast(eq(PlazaMessageType.Event.LEFT), any());
    }

    @Test
    @DisplayName("프로필을 바꾸면 광장 캐릭터도 따라 바뀐다")
    void profileChangeFollowsIntoPlaza() {
        // given
        Session session = PlazaFixture.session(1, NOW);
        plazaCommandService.enter(session);

        // when
        plazaCommandService.syncProfile(session.getId(), "곡괭이1007", "💎");

        // then
        PlazaMember member = plazaRepository.findBySessionId(session.getId()).orElseThrow();
        assertThat(member.getNickname()).isEqualTo("곡괭이1007");
        assertThat(member.getAvatar()).isEqualTo("💎");
        verify(plazaBroadcaster).broadcast(eq(PlazaMessageType.Event.PROFILE), any());
    }

    @Test
    @DisplayName("같은 값으로 프로필을 저장하면 광장에 알리지 않는다")
    void unchangedProfileIsNotBroadcast() {
        Session session = PlazaFixture.session(1, NOW);
        plazaCommandService.enter(session);

        plazaCommandService.syncProfile(session.getId(), session.getNickname(), session.getAvatar());

        verify(plazaBroadcaster, never()).broadcast(eq(PlazaMessageType.Event.PROFILE), any());
    }

    @Test
    @DisplayName("채팅은 작성 시점 이름·아바타·색을 그대로 남긴다")
    void chatKeepsWriterSnapshot() {
        // given
        Session session = PlazaFixture.session(1, NOW);
        plazaCommandService.enter(session);
        plazaCommandService.chat(session, new PlazaChatCommand("  안녕하세요~  "));

        // when
        plazaCommandService.syncProfile(session.getId(), "곡괭이1007", "💎");

        // then
        assertThat(plazaRepository.findChat()).singleElement()
                .satisfies(message -> {
                    assertThat(message.body()).isEqualTo("안녕하세요~");
                    assertThat(message.nickname()).isEqualTo("두더지1");
                    assertThat(message.avatar()).isEqualTo("⛏");
                });
    }

    @Test
    @DisplayName("10분 경계에는 대화를 비우고 그 경계 시각을 알린다")
    void chatResetClearsAndAnnounces() {
        // given
        Session session = PlazaFixture.session(1, NOW);
        plazaCommandService.enter(session);
        plazaCommandService.chat(session, new PlazaChatCommand("안녕하세요~"));
        clock.advance(Duration.ofMinutes(10));

        // when
        plazaCommandService.resetChat();

        // then
        assertThat(plazaRepository.findChat()).isEmpty();
        verify(plazaBroadcaster).broadcast(eq(PlazaMessageType.Event.CHAT_RESET), any());
    }

    @Test
    @DisplayName("기구에 탄 동안의 이동은 무시한다")
    void moveWhileRidingIsIgnored() {
        // given
        Session session = PlazaFixture.session(1, NOW);
        enterAt(session, 64, 74);
        plazaCommandService.ride(session, new PlazaRideCommand("seesaw"));
        clock.advance(Duration.ofSeconds(1));

        // when
        plazaCommandService.move(session, new PlazaMoveCommand(70.0, 80.0, 1));

        // then
        PlazaMember member = plazaRepository.findBySessionId(session.getId()).orElseThrow();
        assertThat(member.getX()).isEqualTo(64);
        assertThat(plazaRepository.drainMoved()).isEmpty();
    }

    /** 입장 위치는 임의라, 규칙을 보려면 원하는 자리로 걸어 보낸 뒤 시작한다. */
    private PlazaMember enterAt(Session session, double x, double y) {
        plazaCommandService.enter(session);
        clock.advance(Duration.ofSeconds(60));
        plazaCommandService.move(session, new PlazaMoveCommand(x, y, 0));
        plazaRepository.drainMoved();
        return plazaRepository.findBySessionId(session.getId()).orElseThrow();
    }
}
