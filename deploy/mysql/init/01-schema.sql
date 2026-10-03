-- 초기화 스크립트를 읽는 클라이언트 문자셋을 못 박는다.
-- 이게 없으면 latin1 로 읽혀 한글과 이모지가 DB 안에서 이중 인코딩된다
-- (테이블이 utf8mb4 여도 들어갈 때 이미 깨진다).
SET NAMES utf8mb4;

-- 스키마. Hibernate 가 만든 DDL 을 그대로 뜬 뒤 제약 이름만 읽기 쉽게 바꿨다
-- (validate 는 테이블·컬럼·타입만 보고 제약 이름은 보지 않는다).
--
-- prod 는 ddl-auto: validate 라 이 파일이 먼저 돌아야 앱이 뜬다.
-- MySQL 이미지는 데이터 디렉터리가 비어 있을 때만 이 디렉터리를 실행한다 —
-- 스키마를 고치면 볼륨을 지워야 다시 적용된다.
-- 테이블이 늘어나기 시작하면 Flyway 로 옮기는 편이 낫다.

CREATE TABLE games (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    code          VARCHAR(30)  NOT NULL,
    name          VARCHAR(30)  NOT NULL,
    name_en       VARCHAR(50)  NOT NULL,
    description   VARCHAR(200) NOT NULL,
    thumbnail_url VARCHAR(500)     NULL,
    min_players   SMALLINT     NOT NULL,
    max_players   SMALLINT     NOT NULL,
    play_minutes  VARCHAR(20)      NULL,
    is_playable   BIT(1)       NOT NULL,
    sort_order    SMALLINT     NOT NULL,
    created_at    DATETIME(6)  NOT NULL,
    updated_at    DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_games_code (code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE game_tags (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    game_id    BIGINT      NOT NULL,
    name       VARCHAR(20) NOT NULL,
    sort_order SMALLINT    NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_game_tags_game_name (game_id, name),
    CONSTRAINT fk_game_tags_game FOREIGN KEY (game_id) REFERENCES games (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 곡 목록. 광장의 사람·대화·음악 상태는 전부 메모리에 있어 테이블이 없다.
CREATE TABLE plaza_tracks (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    code         VARCHAR(30)  NOT NULL,
    title        VARCHAR(40)  NOT NULL,
    mood         VARCHAR(20)  NOT NULL,
    src_url      VARCHAR(500) NOT NULL,
    duration_sec SMALLINT     NOT NULL,
    sort_order   SMALLINT     NOT NULL,
    created_at   DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_plaza_tracks_code (code),
    -- 순서가 겹치면 다음 곡이 어느 쪽인지 정해지지 않는다 (P-18)
    UNIQUE KEY uk_plaza_tracks_sort_order (sort_order)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
