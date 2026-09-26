package com.seyeong.playgroundback.global.config;

import com.seyeong.playgroundback.global.auth.CurrentSessionArgumentResolver;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private static final long PREFLIGHT_CACHE_SECONDS = 3600;

    private final CurrentSessionArgumentResolver currentSessionArgumentResolver;
    private final PlaygroundProperties properties;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentSessionArgumentResolver);
    }

    /**
     * 프론트가 다른 출처에서 돌기 때문에 필요하다 (Vite 개발 서버 등).
     * 세션 쿠키를 주고받으므로 allowCredentials 가 켜져 있고, 그러면 출처에 {@code *} 를 쓸 수 없다.
     * 대신 allowedOriginPatterns 로 포트 와일드카드까지 받는다.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(properties.allowedOrigins().toArray(String[]::new))
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
                .allowCredentials(true)
                .maxAge(PREFLIGHT_CACHE_SECONDS);
    }
}
