package com.seyeong.playgroundback.plaza.service;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.plaza.domain.PlazaChatMessage;
import com.seyeong.playgroundback.plaza.domain.PlazaChatWindow;
import com.seyeong.playgroundback.plaza.domain.PlazaColors;
import com.seyeong.playgroundback.plaza.domain.PlazaLeaveReason;
import com.seyeong.playgroundback.plaza.domain.PlazaMember;
import com.seyeong.playgroundback.plaza.domain.PlazaMessageType;
import com.seyeong.playgroundback.plaza.domain.PlazaRules;
import com.seyeong.playgroundback.plaza.domain.PlazaSpot;
import com.seyeong.playgroundback.plaza.dto.PlazaChatCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaChatResetResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaChatResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaColorCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaColorResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaDismountResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaEmoteCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaEmoteResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaLeftResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaMemberResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaMoveCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaMovesResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaMusicPickCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaProfileResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaRideCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaRideResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaStateResponse;
import com.seyeong.playgroundback.plaza.exception.PlazaErrorCode;
import com.seyeong.playgroundback.plaza.repository.PlazaRepository;
import com.seyeong.playgroundback.session.domain.Session;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 광장 안에서 일어나는 모든 변화.
 *
 * <p>광장 상태는 메모리에만 있어 트랜잭션을 걸지 않는다. DB(곡 목록)를 읽는 것은 PlazaReadService 뿐이다.
 *
 * <p>모든 메서드가 같은 꼴이다 — 잠금 안에서 상태를 바꾸고, 잠금을 놓은 뒤에 전파한다.
 * 전파를 잠금 안에서 하면 소켓 하나가 막혔을 때 광장 전체가 멈춘다.
 */
@Service
@RequiredArgsConstructor
public class PlazaCommandService {

    private final PlazaRepository plazaRepository;
    private final PlazaReadService plazaReadService;
    private final PlazaBroadcaster plazaBroadcaster;
    private final PlazaMusicPlayer plazaMusicPlayer;
    private final Clock clock;

    /** 정원이 차 있으면 거절한다 (P-22). 색은 남이 쓰지 않는 것 중 하나가 자동 배정된다 (P-24). */
    public PlazaStateResponse enter(Session session) {
        Instant now = Instant.now(clock);
        PlazaMemberResponse joined = plazaRepository.withLock(
                () -> PlazaMemberResponse.from(join(session, now)));
        plazaBroadcaster.broadcastExcept(session.getId(), PlazaMessageType.Event.JOINED, joined);
        return plazaReadService.getState(joined.id());
    }

    /** 스스로 나가거나 연결이 끊겼을 때. 광장에 없던 세션이면 아무 일도 없다. */
    public void leave(long sessionId, PlazaLeaveReason reason) {
        Optional<PlazaMember> removed = plazaRepository.remove(sessionId);
        if (removed.isEmpty()) {
            return;
        }
        plazaBroadcaster.broadcast(PlazaMessageType.Event.LEFT,
                new PlazaLeftResponse(removed.get().getId(), reason.getCode()));
        plazaMusicPlayer.stopWhenEmpty();
    }

    /**
     * 클라이언트가 보낸 좌표를 받아 쓴다 (M-P10). 바로 내보내지 않고 100ms 배치에 모은다.
     * 거절할 때는 서버가 아는 마지막 좌표를 함께 돌려준다 — 거절만 하면 어디로 돌아갈지 모른다.
     */
    public void move(Session session, PlazaMoveCommand command) {
        Instant now = Instant.now(clock);
        PlazaMember member = getMember(session);
        if (member.isRiding()) {
            return;
        }
        int facing = PlazaMember.validateFacing(command.dir());
        try {
            plazaRepository.runInLock(() -> {
                member.moveTo(command.x(), command.y(), facing, now);
                plazaRepository.markMoved(member.getId());
            });
        } catch (BusinessException exception) {
            plazaBroadcaster.sendTo(session.getId(), PlazaMessageType.Event.MOVES,
                    PlazaMovesResponse.ofSingle(member));
            throw exception;
        }
    }

    /** 100ms 마다 그 사이 움직인 사람만 묶어 내보낸다. */
    public void flushMoves() {
        List<PlazaMember> moved = plazaRepository.drainMoved();
        if (moved.isEmpty()) {
            return;
        }
        plazaBroadcaster.broadcast(PlazaMessageType.Event.MOVES, PlazaMovesResponse.of(moved));
    }

    public void emote(Session session, PlazaEmoteCommand command) {
        PlazaMember member = getMember(session);
        plazaBroadcaster.broadcast(PlazaMessageType.Event.EMOTE,
                new PlazaEmoteResponse(member.getId(), command.slot()));
    }

    /** 자리는 서버가 고른다. 두 사람이 같은 순간에 같은 기구를 노려도 한 명만 앉는다 (P-12). */
    public void ride(Session session, PlazaRideCommand command) {
        PlazaSpot spot = PlazaSpot.from(command.spot())
                .filter(PlazaSpot::isRideable)
                .orElseThrow(() -> new BusinessException(CommonErrorCode.VALIDATION_ERROR));
        PlazaMember member = getMember(session);
        int seat = plazaRepository.withLock(() -> {
            int free = findFreeSeat(spot);
            member.ride(spot, free);
            return free;
        });
        plazaBroadcaster.broadcast(PlazaMessageType.Event.RIDE,
                new PlazaRideResponse(member.getId(), spot.getCode(), seat));
    }

    /** 타기 전 좌표에 그대로 선다. 기구에 앉아 있는 동안에도 좌표는 그 자리였다. */
    public void dismount(Session session) {
        PlazaMember member = getMember(session);
        PlazaSpot spot = plazaRepository.withLock(member::dismount);
        if (spot == null) {
            return;
        }
        plazaBroadcaster.broadcast(PlazaMessageType.Event.DISMOUNT,
                new PlazaDismountResponse(member.getId(), spot.getCode(), member.getX(), member.getY()));
    }

    public void chat(Session session, PlazaChatCommand command) {
        PlazaMember member = getMember(session);
        PlazaChatMessage message = plazaRepository.addChat(member, command.body().strip(), Instant.now(clock));
        plazaBroadcaster.broadcast(PlazaMessageType.Event.CHAT, PlazaChatResponse.from(message));
    }

    /** 10분 경계마다 전부 지운다 (P-23). 벽시계 기준이라 클라이언트도 같은 시점에 스스로 비운다. */
    public void resetChat() {
        plazaRepository.clearChat();
        plazaBroadcaster.broadcast(PlazaMessageType.Event.CHAT_RESET,
                new PlazaChatResetResponse(PlazaChatWindow.currentResetAt(Instant.now(clock))));
    }

    /** 한 색은 한 사람만 쓴다 (P-24). 색 경합도 자리 배정과 같이 한 번에 하나씩 처리한다. */
    public void changeColor(Session session, PlazaColorCommand command) {
        PlazaMember member = getMember(session);
        String color = command.color();
        plazaRepository.runInLock(() -> {
            if (isTakenByOther(member, color)) {
                throw new BusinessException(PlazaErrorCode.COLOR_TAKEN);
            }
            member.changeColor(color);
        });
        plazaBroadcaster.broadcast(PlazaMessageType.Event.COLOR,
                new PlazaColorResponse(member.getId(), color));
    }

    /** 프로필을 바꾸면 광장 안 캐릭터도 즉시 따라간다 (0-7, M-P13). */
    public void syncProfile(long sessionId, String nickname, String avatar) {
        Optional<PlazaMember> found = plazaRepository.findBySessionId(sessionId);
        if (found.isEmpty()) {
            return;
        }
        PlazaMember member = found.get();
        if (!plazaRepository.withLock(() -> member.syncProfile(nickname, avatar))) {
            return;
        }
        plazaBroadcaster.broadcast(PlazaMessageType.Event.PROFILE,
                new PlazaProfileResponse(member.getId(), nickname, avatar));
    }

    /** 누구나 고를 수 있지만 DJ 부스 근처여야 한다 (P-15). */
    public void pickMusic(Session session, PlazaMusicPickCommand command) {
        getMember(session).requireNear(PlazaSpot.DJ);
        plazaMusicPlayer.pick(command.trackId());
    }

    public void stopMusic(Session session) {
        getMember(session).requireNear(PlazaSpot.DJ);
        plazaMusicPlayer.stop();
    }

    private PlazaMember join(Session session, Instant now) {
        if (plazaRepository.findBySessionId(session.getId()).isPresent()) {
            throw new BusinessException(CommonErrorCode.ALREADY_IN_ROOM);
        }
        if (plazaRepository.count() >= PlazaRules.CAPACITY) {
            throw new BusinessException(PlazaErrorCode.PLAZA_FULL);
        }
        return plazaRepository.save(new PlazaMember(
                plazaRepository.nextMemberId(),
                session.getId(),
                session.getNickname(),
                session.getAvatar(),
                pickFreeColor(),
                PlazaRules.randomX(),
                PlazaRules.randomY(),
                now
        ));
    }

    /** 색이 정원보다 많아 정원이 차지 않았다면 반드시 남는다. */
    private String pickFreeColor() {
        Set<String> taken = plazaRepository.findAll().stream()
                .map(PlazaMember::getColorCode)
                .collect(Collectors.toUnmodifiableSet());
        return PlazaColors.SUPPORTED.stream()
                .filter(color -> !taken.contains(color))
                .findFirst()
                .orElseThrow(() -> new BusinessException(PlazaErrorCode.PLAZA_FULL));
    }

    private int findFreeSeat(PlazaSpot spot) {
        List<PlazaMember> members = plazaRepository.findAll();
        return IntStream.range(0, spot.getSeats())
                .filter(seat -> members.stream().noneMatch(member -> member.isRidingSeat(spot, seat)))
                .findFirst()
                .orElseThrow(() -> new BusinessException(PlazaErrorCode.SPOT_FULL));
    }

    private boolean isTakenByOther(PlazaMember member, String color) {
        return plazaRepository.findAll().stream()
                .anyMatch(other -> other.getId() != member.getId() && other.hasColor(color));
    }

    private PlazaMember getMember(Session session) {
        return plazaRepository.findBySessionId(session.getId())
                .orElseThrow(() -> new BusinessException(PlazaErrorCode.NOT_IN_PLAZA));
    }
}
