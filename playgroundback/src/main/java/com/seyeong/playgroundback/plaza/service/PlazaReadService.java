package com.seyeong.playgroundback.plaza.service;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.plaza.domain.PlazaChatWindow;
import com.seyeong.playgroundback.plaza.domain.PlazaColors;
import com.seyeong.playgroundback.plaza.domain.PlazaMember;
import com.seyeong.playgroundback.plaza.domain.PlazaMusic;
import com.seyeong.playgroundback.plaza.domain.PlazaRules;
import com.seyeong.playgroundback.plaza.domain.PlazaTrack;
import com.seyeong.playgroundback.plaza.dto.PlazaChatResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaMemberResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaMusicResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaStateResponse;
import com.seyeong.playgroundback.plaza.dto.PlazaTrackResponse;
import com.seyeong.playgroundback.plaza.exception.PlazaErrorCode;
import com.seyeong.playgroundback.plaza.repository.PlazaRepository;
import com.seyeong.playgroundback.plaza.repository.PlazaTrackRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 광장은 메모리에 있고 곡 목록만 DB 에 있다. 트랜잭션이 필요한 곳은 곡 조회뿐이다. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlazaReadService {

    private final PlazaRepository plazaRepository;
    private final PlazaTrackRepository plazaTrackRepository;
    private final Clock clock;

    /** 놀이터 화면 하나를 그리는 데 필요한 전부. 입장 응답이자 재동기화 응답이다. */
    public PlazaStateResponse getState(long meId) {
        List<PlazaTrack> tracks = getTracks();
        return new PlazaStateResponse(
                PlazaRules.CAPACITY,
                meId,
                plazaRepository.findAll().stream().map(PlazaMemberResponse::from).toList(),
                findCurrentMusic(tracks).orElse(null),
                tracks.stream().map(PlazaTrackResponse::from).toList(),
                plazaRepository.findChat().stream().map(PlazaChatResponse::from).toList(),
                PlazaChatWindow.nextResetAt(Instant.now(clock)),
                PlazaColors.SUPPORTED
        );
    }

    public List<PlazaTrack> getTracks() {
        return plazaTrackRepository.findAllByOrderBySortOrderAsc();
    }

    public PlazaTrack getTrack(long trackId) {
        return plazaTrackRepository.findById(trackId)
                .orElseThrow(() -> new BusinessException(PlazaErrorCode.TRACK_NOT_FOUND));
    }

    /** 자동 넘김 (P-18). sort_order 다음 곡이고, 마지막이면 처음으로 돌아간다. */
    public Optional<PlazaTrack> findNextTrack(long currentTrackId) {
        List<PlazaTrack> tracks = getTracks();
        if (tracks.isEmpty()) {
            return Optional.empty();
        }
        int current = indexOf(tracks, currentTrackId);
        return Optional.of(tracks.get((current + 1) % tracks.size()));
    }

    /** 지금 나오는 사람 수와 색을 쓰는 쪽이 있어 광장 안 사람을 그대로 넘긴다. */
    public List<PlazaMember> getMembers() {
        return plazaRepository.findAll();
    }

    private Optional<PlazaMusicResponse> findCurrentMusic(List<PlazaTrack> tracks) {
        Optional<PlazaMusic> music = plazaRepository.findMusic();
        if (music.isEmpty()) {
            return Optional.empty();
        }
        return tracks.stream()
                .filter(track -> track.getId() == music.get().trackId())
                .findFirst()
                .map(track -> PlazaMusicResponse.of(track, music.get().startedAt()));
    }

    /** 목록에 없는 곡이면 -1 이 되어 다음 곡이 첫 곡이 된다. 곡을 지운 뒤에도 재생이 멈추지 않는다. */
    private int indexOf(List<PlazaTrack> tracks, long trackId) {
        for (int index = 0; index < tracks.size(); index++) {
            if (tracks.get(index).getId() == trackId) {
                return index;
            }
        }
        return -1;
    }
}
