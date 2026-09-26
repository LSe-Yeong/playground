package com.seyeong.playgroundback.plaza.dto;

import jakarta.validation.constraints.NotNull;

/** DJ 부스 근처여야 한다. 누구나 고를 수 있고, 고르면 즉시 바뀐다. */
public record PlazaMusicPickCommand(@NotNull Long trackId) {
}
