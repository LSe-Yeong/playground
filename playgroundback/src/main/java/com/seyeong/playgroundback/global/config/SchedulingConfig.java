package com.seyeong.playgroundback.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** 세션 TTL 스위퍼, 위치 배치 전송, 채팅 초기화 등 주기 작업을 켠다. 스레드 수는 spring.task.scheduling 에서 정한다. */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
