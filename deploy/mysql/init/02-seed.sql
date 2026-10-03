-- 초기화 스크립트를 읽는 클라이언트 문자셋을 못 박는다.
-- 이게 없으면 latin1 로 읽혀 한글과 이모지가 DB 안에서 이중 인코딩된다
-- (테이블이 utf8mb4 여도 들어갈 때 이미 깨진다).
SET NAMES utf8mb4;

-- 카드와 곡. prod 는 sql.init.mode: never 라 data.sql 이 돌지 않으므로 여기서 넣는다.

INSERT INTO games (code, name, name_en, description, thumbnail_url,
                   min_players, max_players, play_minutes, is_playable, sort_order,
                   created_at, updated_at) VALUES
('plaza',   '놀이터', 'Plaza',       '캐릭터를 움직이며 다른 사람들과 이야기하는 공간. 게임이 아니라 그냥 모이는 곳이다', NULL, 1, 20, '자유',     b'1', 0, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
-- 한번더는 아직 만들지 않았다. 구현하면 is_playable 만 b'1' 로 바꾼다.
('onemore', '한번더', 'OneMoreTime', '주사위 4개로 11개의 갱도를 파내려가, 가장 깊은 곳의 보물 3개를 먼저 찾는 사람이 이긴다', NULL, 2, 6,  '15~20분', b'0', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('game2',   '게임 2', 'Coming Soon', '다음 게임을 준비하고 있습니다', NULL, 0, 0, NULL, b'0', 2, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('game3',   '게임 3', 'Coming Soon', '다음 게임을 준비하고 있습니다', NULL, 0, 0, NULL, b'0', 3, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
('game4',   '게임 4', 'Coming Soon', '다음 게임을 준비하고 있습니다', NULL, 0, 0, NULL, b'0', 4, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));

INSERT INTO game_tags (game_id, name, sort_order) VALUES
((SELECT id FROM games WHERE code = 'plaza'),   '소통',      0),
((SELECT id FROM games WHERE code = 'plaza'),   '자유 이동', 1),
((SELECT id FROM games WHERE code = 'plaza'),   '채팅',      2),
((SELECT id FROM games WHERE code = 'onemore'), '주사위',    0),
((SELECT id FROM games WHERE code = 'onemore'), '운과 배짱', 1),
((SELECT id FROM games WHERE code = 'onemore'), '쉬운 규칙', 2);

-- src_url 을 상대 경로로 둔다. 프론트와 API 가 같은 오리진이라 브라우저가 페이지 주소를
-- 기준으로 풀어 주고, 덕분에 도메인이 바뀌어도 이 행을 고칠 필요가 없다.
-- (로컬 개발용 data.sql 은 프론트 5173 · 백엔드 8080 으로 오리진이 달라 절대 주소를 쓴다.)
-- duration_sec 은 실제 음원 길이와 맞아야 한다. 짧으면 끝나기 전에 넘어가고, 길면 침묵이 흐른다.
INSERT INTO plaza_tracks (code, title, mood, src_url, duration_sec, sort_order, created_at) VALUES
('energetic', '신나는 하루', 'Energetic', '/pg/api/audio/01_energetic_inst.mp3', 132, 0, CURRENT_TIMESTAMP(6)),
('calm',      '잔잔한 오후', 'Calm',      '/pg/api/audio/02_calm_inst.mp3',      132, 1, CURRENT_TIMESTAMP(6)),
('tension',   '두근두근',    'Tension',   '/pg/api/audio/03_tension_inst.mp3',   132, 2, CURRENT_TIMESTAMP(6)),
('cute',      '깡총깡총',    'Cute',      '/pg/api/audio/04_cute_inst.mp3',      132, 3, CURRENT_TIMESTAMP(6)),
('mystic',    '신비한 숲',   'Mystic',    '/pg/api/audio/05_mystic_inst.mp3',    132, 4, CURRENT_TIMESTAMP(6)),
('epic',      '웅장한 광장', 'Epic',      '/pg/api/audio/06_epic_inst.mp3',      132, 5, CURRENT_TIMESTAMP(6));
