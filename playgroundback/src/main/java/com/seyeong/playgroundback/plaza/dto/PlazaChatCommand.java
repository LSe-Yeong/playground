package com.seyeong.playgroundback.plaza.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** 보낸 사람은 담지 않는다. 서버가 세션으로 안다. */
public record PlazaChatCommand(@NotBlank @Size(max = 60) String body) {
}
