package com.seyeong.playgroundback.plaza.domain;

import java.util.List;

/**
 * 캐릭터 색 24종 (P-24, ERD 부록 E). 순서가 곧 선택 모달의 표시 순서다.
 * 실제 색상값은 클라이언트가 갖고, 서버는 코드만 검증한다.
 * 한 색은 한 사람만 쓰므로 색 수가 정원보다 많아야 한다.
 */
public final class PlazaColors {

    public static final List<String> SUPPORTED = List.of(
            "red", "blue", "green", "yellow", "purple", "pink", "teal", "orange", "navy", "mint",
            "coral", "lime", "sky", "indigo", "violet", "rose", "brown", "olive", "gold", "cyan",
            "beige", "gray", "black", "white"
    );

    static {
        if (SUPPORTED.size() < PlazaRules.CAPACITY) {
            throw new IllegalStateException("색 수가 정원보다 적으면 마지막 입장자가 색을 받지 못한다");
        }
    }

    private PlazaColors() {
    }

    public static boolean isSupported(String color) {
        return SUPPORTED.contains(color);
    }
}
