package com.seyeong.playgroundback.session.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** 바꿀 필드만 보낸다. 보낸 필드는 비어 있으면 안 된다. */
public record UpdateSessionRequest(
        @Size(max = 20) @Pattern(regexp = ".*\\S.*") String nickname,
        @Pattern(regexp = ".*\\S.*") String avatar
) {
}
