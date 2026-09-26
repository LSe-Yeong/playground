package com.seyeong.playgroundback.plaza.repository;

import com.seyeong.playgroundback.plaza.domain.PlazaChatMessage;
import com.seyeong.playgroundback.plaza.domain.PlazaChatWindow;
import com.seyeong.playgroundback.plaza.domain.PlazaMember;
import com.seyeong.playgroundback.plaza.domain.PlazaMusic;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Supplier;
import org.springframework.stereotype.Repository;

/**
 * 광장 하나의 전역 상태. 서버가 켜져 있는 동안 계속 열려 있고, 사람이 없어도 사라지지 않는다.
 *
 * <p>입장·자리 배정·색 선택은 모두 "먼저 확인하고 나서 바꾸는" 동작이라
 * 동시에 들어오면 정원을 넘기거나 한 자리에 두 명이 앉는다. 그래서 자물쇠 하나로 한 번에 하나씩 처리한다.
 * 정원이 20명이라 경합이 거의 없어 더 잘게 쪼갤 이유가 없다.
 *
 * <p>여러 단계를 묶어야 하는 곳은 {@link #withLock}·{@link #runInLock} 으로 감싼다.
 * 소켓 전송은 반드시 잠금 밖에서 한다 — 전송이 막히면 광장 전체가 멈춘다.
 */
@Repository
public class PlazaRepository {

    private final ReentrantLock lock = new ReentrantLock();

    /** 세션 하나당 한 명이다. 입장 순서를 유지해 스냅샷 순서가 흔들리지 않게 한다. */
    private final Map<Long, PlazaMember> membersBySessionId = new LinkedHashMap<>();
    private final List<PlazaChatMessage> chat = new ArrayList<>();

    /** 마지막 전송 뒤에 움직인 사람. 100ms 마다 비우며 내보낸다 (M-P10). */
    private final Set<Long> movedMemberIds = new LinkedHashSet<>();

    private long memberIdSequence;
    private long chatIdSequence;
    private long musicGeneration;
    private PlazaMusic music;

    public <T> T withLock(Supplier<T> action) {
        lock.lock();
        try {
            return action.get();
        } finally {
            lock.unlock();
        }
    }

    public void runInLock(Runnable action) {
        lock.lock();
        try {
            action.run();
        } finally {
            lock.unlock();
        }
    }

    public Optional<PlazaMember> findBySessionId(long sessionId) {
        return withLock(() -> Optional.ofNullable(membersBySessionId.get(sessionId)));
    }

    public List<PlazaMember> findAll() {
        return withLock(() -> List.copyOf(membersBySessionId.values()));
    }

    public List<Long> findAllSessionIds() {
        return withLock(() -> List.copyOf(membersBySessionId.keySet()));
    }

    public int count() {
        return withLock(membersBySessionId::size);
    }

    public boolean isEmpty() {
        return count() == 0;
    }

    public long nextMemberId() {
        return withLock(() -> ++memberIdSequence);
    }

    public PlazaMember save(PlazaMember member) {
        runInLock(() -> membersBySessionId.put(member.getSessionId(), member));
        return member;
    }

    public Optional<PlazaMember> remove(long sessionId) {
        return withLock(() -> {
            PlazaMember removed = membersBySessionId.remove(sessionId);
            if (removed != null) {
                movedMemberIds.remove(removed.getId());
            }
            return Optional.ofNullable(removed);
        });
    }

    public void markMoved(long memberId) {
        runInLock(() -> movedMemberIds.add(memberId));
    }

    /** 배치 전송용. 꺼내면서 비운다. */
    public List<PlazaMember> drainMoved() {
        return withLock(() -> {
            if (movedMemberIds.isEmpty()) {
                return List.<PlazaMember>of();
            }
            List<PlazaMember> moved = membersBySessionId.values().stream()
                    .filter(member -> movedMemberIds.contains(member.getId()))
                    .toList();
            movedMemberIds.clear();
            return moved;
        });
    }

    public PlazaChatMessage addChat(PlazaMember writer, String body, Instant now) {
        return withLock(() -> {
            PlazaChatMessage message = PlazaChatMessage.of(++chatIdSequence, writer, body, now);
            chat.add(message);
            if (chat.size() > PlazaChatWindow.MAX_RETAINED) {
                chat.removeFirst();
            }
            return message;
        });
    }

    public List<PlazaChatMessage> findChat() {
        return withLock(() -> List.copyOf(chat));
    }

    /** 10분 경계마다 전부 지운다 (P-23). id 는 이어 간다 — 되감으면 클라이언트가 지난 줄과 헷갈린다. */
    public void clearChat() {
        runInLock(chat::clear);
    }

    public Optional<PlazaMusic> findMusic() {
        return withLock(() -> Optional.ofNullable(music));
    }

    /** 새 곡을 걸고 그 세대를 돌려준다. 이전 곡의 종료 타이머는 이 값으로 무효가 된다. */
    public PlazaMusic startMusic(long trackId, Instant startedAt) {
        return withLock(() -> {
            music = new PlazaMusic(trackId, startedAt, ++musicGeneration);
            return music;
        });
    }

    public void stopMusic() {
        runInLock(() -> {
            music = null;
            musicGeneration++;
        });
    }

    /** 그 세대의 곡이 아직 나오고 있을 때만 값이 있다. */
    public Optional<PlazaMusic> findMusicOfGeneration(long generation) {
        return withLock(() -> Optional.ofNullable(music).filter(current -> current.generation() == generation));
    }
}
