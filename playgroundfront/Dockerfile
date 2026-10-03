# syntax=docker/dockerfile:1

# ---------- 빌드 ----------
FROM node:22-alpine AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite 는 이 값을 번들에 문자열로 박는다. 런타임 환경변수로는 바뀌지 않는다.
# 소켓 주소도 여기서 파생된다 (https -> wss).
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
RUN test -n "$VITE_API_BASE" || (echo "VITE_API_BASE 빌드 인자가 필요합니다" && exit 1)

# 앱이 놓일 경로. 번들 안의 에셋 주소가 여기에 맞춰 만들어진다.
ARG VITE_BASE=/pg/
ENV VITE_BASE=${VITE_BASE}

RUN npm run build

# ---------- 실행 ----------
FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# 앞단 nginx 가 경로를 그대로 넘기므로, 파일도 같은 깊이에 둬야 찾는다.
COPY --from=build /src/dist /usr/share/nginx/html/pg

EXPOSE 5174
