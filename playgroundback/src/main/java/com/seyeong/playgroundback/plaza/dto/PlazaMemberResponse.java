package com.seyeong.playgroundback.plaza.dto;

import com.seyeong.playgroundback.plaza.domain.PlazaMember;

/** plaza.joined 의 payload 이자 PlazaState.members 의 원소다. */
public record PlazaMemberResponse(
        long id,
        String nickname,
        String avatar,
        String color,
        double x,
        double y,
        int dir,
        Riding riding
) {

    /** 타고 있지 않으면 riding 이 null 이다. */
    public record Riding(String spot, int seat) {
    }

    public static PlazaMemberResponse from(PlazaMember member) {
        Riding riding = member.isRiding()
                ? new Riding(member.getRidingSpot().getCode(), member.getRidingSeat())
                : null;
        return new PlazaMemberResponse(
                member.getId(),
                member.getNickname(),
                member.getAvatar(),
                member.getColorCode(),
                member.getX(),
                member.getY(),
                member.getFacing(),
                riding
        );
    }
}
