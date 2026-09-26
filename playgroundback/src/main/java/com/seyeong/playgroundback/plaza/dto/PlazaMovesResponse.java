package com.seyeong.playgroundback.plaza.dto;

import com.seyeong.playgroundback.plaza.domain.PlazaMember;
import java.util.List;

/**
 * 100ms 동안 움직인 사람만 묶어 보낸다 (M-P10).
 * 20명이 동시에 걸으면 위치가 초당 수십 번 바뀌는데, 매번 전체 상태를 실으면 대부분이 안 바뀐 값이다.
 */
public record PlazaMovesResponse(List<Member> members) {

    public record Member(long id, double x, double y, int dir) {

        public static Member from(PlazaMember member) {
            return new Member(member.getId(), member.getX(), member.getY(), member.getFacing());
        }
    }

    public static PlazaMovesResponse of(List<PlazaMember> members) {
        return new PlazaMovesResponse(members.stream().map(Member::from).toList());
    }

    /** 이동을 거절할 때 서버가 아는 마지막 좌표를 되돌려 준다. 거절만 하면 어디로 돌아갈지 모른다. */
    public static PlazaMovesResponse ofSingle(PlazaMember member) {
        return new PlazaMovesResponse(List.of(Member.from(member)));
    }
}
