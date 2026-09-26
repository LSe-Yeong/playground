package com.seyeong.playgroundback.plaza.websocket;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import com.seyeong.playgroundback.global.websocket.SocketCommand;
import com.seyeong.playgroundback.global.websocket.SocketCommandHandler;
import com.seyeong.playgroundback.global.websocket.SocketPayloadReader;
import com.seyeong.playgroundback.plaza.domain.PlazaLeaveReason;
import com.seyeong.playgroundback.plaza.domain.PlazaMessageType;
import com.seyeong.playgroundback.plaza.dto.PlazaChatCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaColorCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaEmoteCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaMoveCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaMusicPickCommand;
import com.seyeong.playgroundback.plaza.dto.PlazaRideCommand;
import com.seyeong.playgroundback.plaza.service.PlazaCommandService;
import com.seyeong.playgroundback.session.domain.Session;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * plaza.* 명령을 받는다. 거절(BusinessException)은 공용 핸들러가 보낸 사람에게만 error 로 돌려준다.
 * 인자가 없는 명령(dismount · music.stop · leave)은 payload 를 읽지 않는다 — {@code {}} 든 없든 같다.
 */
@Component
@RequiredArgsConstructor
public class PlazaSocketCommandHandler implements SocketCommandHandler {

    private final PlazaCommandService plazaCommandService;
    private final SocketPayloadReader socketPayloadReader;

    @Override
    public boolean supports(String type) {
        return PlazaMessageType.Command.ALL.contains(type);
    }

    @Override
    public void handle(Session session, SocketCommand command) {
        switch (command.type()) {
            case PlazaMessageType.Command.MOVE ->
                    plazaCommandService.move(session, read(command, PlazaMoveCommand.class));
            case PlazaMessageType.Command.EMOTE ->
                    plazaCommandService.emote(session, read(command, PlazaEmoteCommand.class));
            case PlazaMessageType.Command.RIDE ->
                    plazaCommandService.ride(session, read(command, PlazaRideCommand.class));
            case PlazaMessageType.Command.DISMOUNT -> plazaCommandService.dismount(session);
            case PlazaMessageType.Command.CHAT ->
                    plazaCommandService.chat(session, read(command, PlazaChatCommand.class));
            case PlazaMessageType.Command.COLOR ->
                    plazaCommandService.changeColor(session, read(command, PlazaColorCommand.class));
            case PlazaMessageType.Command.MUSIC_PICK ->
                    plazaCommandService.pickMusic(session, read(command, PlazaMusicPickCommand.class));
            case PlazaMessageType.Command.MUSIC_STOP -> plazaCommandService.stopMusic(session);
            case PlazaMessageType.Command.LEAVE ->
                    plazaCommandService.leave(session.getId(), PlazaLeaveReason.LEFT);
            default -> throw new BusinessException(CommonErrorCode.INVALID_REQUEST);
        }
    }

    private <T> T read(SocketCommand command, Class<T> type) {
        return socketPayloadReader.read(command, type);
    }
}
