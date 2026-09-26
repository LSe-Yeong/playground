package com.seyeong.playgroundback.plaza.domain;

import java.time.Instant;

/**
 * 지금 나오는 곡 (ERD plaza_music). 광장이 하나뿐이라 곡도 하나뿐이다.
 * 재생 위치를 계속 보내지 않고 startedAt 만 두는 이유는 API 명세 4장에 있다 —
 * 늦게 들어온 사람도 같은 지점을 계산해 낼 수 있다.
 *
 * @param generation 곡이 바뀔 때마다 1씩 오른다. 종료 타이머가 자기 곡이 아직 나오는지 확인하는 데 쓴다
 */
public record PlazaMusic(long trackId, Instant startedAt, long generation) {
}
