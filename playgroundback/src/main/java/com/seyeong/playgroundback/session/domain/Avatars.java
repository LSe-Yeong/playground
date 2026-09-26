package com.seyeong.playgroundback.session.domain;

import java.util.List;

/** 프로필에서 고를 수 있는 이모지 16종 (0-7). 순서는 선택 모달의 표시 순서다. */
public final class Avatars {

    public static final List<String> SUPPORTED = List.of(
            "⛏", "💎", "🔦", "🪨", "⭐", "🔥", "🍀", "🧭",
            "🐹", "🦊", "🐻", "🐸", "🐧", "🦉", "🐢", "🦔"
    );

    private Avatars() {
    }

    public static boolean isSupported(String avatar) {
        return SUPPORTED.contains(avatar);
    }
}
