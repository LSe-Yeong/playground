package com.seyeong.playgroundback.global.websocket;

import com.seyeong.playgroundback.global.exception.BusinessException;
import com.seyeong.playgroundback.global.exception.CommonErrorCode;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * 소켓 payload 를 명령 DTO 로 바꾸고 Bean Validation 을 돌린다.
 * REST 는 {@code @Valid} 가 붙지만 소켓은 MVC 를 타지 않아, 같은 검증을 여기서 한 번에 해 준다.
 */
@Component
@RequiredArgsConstructor
public class SocketPayloadReader {

    private final JsonMapper jsonMapper;
    private final Validator validator;

    public <T> T read(SocketCommand command, Class<T> type) {
        T payload = convert(command.payload(), type);
        Set<ConstraintViolation<T>> violations = validator.validate(payload);
        if (!violations.isEmpty()) {
            throw new BusinessException(CommonErrorCode.VALIDATION_ERROR);
        }
        return payload;
    }

    private <T> T convert(JsonNode payload, Class<T> type) {
        if (payload == null || payload.isNull()) {
            throw new BusinessException(CommonErrorCode.INVALID_REQUEST);
        }
        try {
            return jsonMapper.treeToValue(payload, type);
        } catch (JacksonException | IllegalArgumentException exception) {
            throw new BusinessException(CommonErrorCode.INVALID_REQUEST);
        }
    }
}
