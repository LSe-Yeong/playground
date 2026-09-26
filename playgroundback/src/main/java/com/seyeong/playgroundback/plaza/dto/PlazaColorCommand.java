package com.seyeong.playgroundback.plaza.dto;

import jakarta.validation.constraints.NotBlank;

public record PlazaColorCommand(@NotBlank String color) {
}
