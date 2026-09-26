package com.seyeong.playgroundback.plaza.dto;

import jakarta.validation.constraints.NotBlank;

/** 자리는 서버가 고른다. 두 사람이 같은 순간에 같은 기구를 노려도 한 명만 앉아야 한다. */
public record PlazaRideCommand(@NotBlank String spot) {
}
