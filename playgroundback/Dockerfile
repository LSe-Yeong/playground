# syntax=docker/dockerfile:1

# ---------- 빌드 ----------
# Java 25 toolchain 이라 JDK 25 가 필요하다 (build.gradle 의 languageVersion).
FROM eclipse-temurin:25-jdk AS build
WORKDIR /src

# 의존성만 먼저 받아 두면 소스만 바뀌었을 때 이 층이 캐시된다.
COPY gradlew settings.gradle build.gradle ./
COPY gradle ./gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies > /dev/null 2>&1 || true

COPY src ./src
# Gradle 캐시를 층 밖에 두어 이미지에 남기지 않는다.
RUN --mount=type=cache,target=/root/.gradle \
    ./gradlew --no-daemon clean bootJar -x test

# ---------- 실행 ----------
FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app

# root 로 돌릴 이유가 없다.
RUN useradd --system --uid 10001 --create-home playground
USER playground

COPY --from=build --chown=playground:playground /src/build/libs/*.jar app.jar

# 이미지 자체가 8081 을 듣게 해 EXPOSE 와 어긋나지 않게 한다 (compose 에서 덮어쓸 수 있다).
# context-path 가 /pg/api 이므로 실제 경로는 /pg/api/... 다.
ENV SERVER_PORT=8081
EXPOSE 8081

# 컨테이너 메모리 한도에 맞춰 힙을 잡는다. 고정 -Xmx 를 쓰면 한도를 바꿀 때마다 같이 고쳐야 한다.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70 -XX:+UseSerialGC"

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
