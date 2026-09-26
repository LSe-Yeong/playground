package com.seyeong.playgroundback.plaza.domain;

import java.util.Set;

/** 놀이터 소켓 메시지 이름. 모두 {@code plaza.} 접두사를 쓴다 (API 명세 3장). */
public final class PlazaMessageType {

    /** 클라이언트 → 서버 */
    public static final class Command {

        public static final String MOVE = "plaza.move";
        public static final String EMOTE = "plaza.emote";
        public static final String RIDE = "plaza.ride";
        public static final String DISMOUNT = "plaza.dismount";
        public static final String CHAT = "plaza.chat";
        public static final String COLOR = "plaza.color";
        public static final String MUSIC_PICK = "plaza.music.pick";
        public static final String MUSIC_STOP = "plaza.music.stop";
        public static final String LEAVE = "plaza.leave";

        public static final Set<String> ALL = Set.of(
                MOVE, EMOTE, RIDE, DISMOUNT, CHAT, COLOR, MUSIC_PICK, MUSIC_STOP, LEAVE
        );

        private Command() {
        }
    }

    /** 서버 → 클라이언트 */
    public static final class Event {

        public static final String STATE = "plaza.state";
        public static final String MOVES = "plaza.moves";
        public static final String JOINED = "plaza.joined";
        public static final String LEFT = "plaza.left";
        public static final String EMOTE = "plaza.emote";
        public static final String RIDE = "plaza.ride";
        public static final String DISMOUNT = "plaza.dismount";
        public static final String PROFILE = "plaza.profile";
        public static final String COLOR = "plaza.color";
        public static final String CHAT = "plaza.chat";
        public static final String CHAT_RESET = "plaza.chatReset";
        public static final String MUSIC = "plaza.music";

        private Event() {
        }
    }

    private PlazaMessageType() {
    }
}
