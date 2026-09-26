package com.seyeong.playgroundback.plaza.dto;

import java.time.Instant;
import java.util.List;

/**
 * 놀이터 화면 하나를 그리는 데 필요한 전부.
 * POST /plaza/enter 의 data 이자 소켓 plaza.state 의 payload 다.
 *
 * @param meId        받는 사람 자신의 memberId. 닉네임 중복을 허용하므로 이름으로 "나" 를 찾으면 틀린다
 * @param chatResetAt 다음 초기화 시각. 클라이언트가 남은 시간을 보여줄 수 있다 (P-23)
 * @param colors      고를 수 있는 24색 전체, 모달 표시 순서대로 (P-24).
 *                    남이 쓰는 색은 members[].color 로 알 수 있어 따로 싣지 않는다
 */
public record PlazaStateResponse(
        int capacity,
        long meId,
        List<PlazaMemberResponse> members,
        PlazaMusicResponse music,
        List<PlazaTrackResponse> tracks,
        List<PlazaChatResponse> chat,
        Instant chatResetAt,
        List<String> colors
) {
}
