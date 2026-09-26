-- 로컬 개발용 카드 시드. 프로토타입(docs/prototype/app.js 의 GAMES)과 같은 순서·문구다.
-- 한번더는 아직 만들지 않아 is_playable 이 FALSE 다. 구현하면 이 한 칸만 TRUE 로 바꾼다.
INSERT INTO games (code, name, name_en, description, thumbnail_url, min_players, max_players, play_minutes, is_playable, sort_order, created_at, updated_at) VALUES
('plaza',   '놀이터', 'Plaza',       '캐릭터를 움직이며 다른 사람들과 이야기하는 공간. 게임이 아니라 그냥 모이는 곳이다', NULL, 1, 20, '자유', TRUE, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('onemore', '한번더', 'OneMoreTime', '주사위 4개로 11개의 갱도를 파내려가, 가장 깊은 곳의 보물 3개를 먼저 찾는 사람이 이긴다', 'https://cdn.playground.app/games/omt-thumb.webp', 2, 6, '15~20분', FALSE, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('game2',   '게임 2', 'Coming Soon', '다음 게임을 준비하고 있습니다', 'https://cdn.playground.app/games/coming-soon.webp', 0, 0, NULL, FALSE, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('game3',   '게임 3', 'Coming Soon', '다음 게임을 준비하고 있습니다', 'https://cdn.playground.app/games/coming-soon.webp', 0, 0, NULL, FALSE, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('game4',   '게임 4', 'Coming Soon', '다음 게임을 준비하고 있습니다', 'https://cdn.playground.app/games/coming-soon.webp', 0, 0, NULL, FALSE, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO game_tags (game_id, name, sort_order) VALUES
((SELECT id FROM games WHERE code = 'plaza'),   '소통',      0),
((SELECT id FROM games WHERE code = 'plaza'),   '자유 이동', 1),
((SELECT id FROM games WHERE code = 'plaza'),   '채팅',      2),
((SELECT id FROM games WHERE code = 'onemore'), '주사위',    0),
((SELECT id FROM games WHERE code = 'onemore'), '운과 배짱', 1),
((SELECT id FROM games WHERE code = 'onemore'), '쉬운 규칙', 2);

-- 로컬 개발용 곡 시드. 프로토타입(docs/prototype/app.js 의 PZ_TRACKS)과 같은 순서·길이다.
-- 음원은 static/audio 에 두고 이 서버가 그대로 내려준다. 로컬 시드라 호스트를 박아 둔다 —
-- 클라이언트가 <audio src> 에 그대로 넣으므로 상대 경로면 프론트 출처로 잘못 붙는다.
-- duration_sec 은 실제 음원 길이와 반드시 맞아야 한다. 짧으면 끝나기 전에 넘어가고, 길면 침묵이 흐른다.
INSERT INTO plaza_tracks (code, title, mood, src_url, duration_sec, sort_order, created_at) VALUES
('energetic', '신나는 하루', 'Energetic', 'http://localhost:8080/pg/api/audio/01_energetic_inst.mp3', 132, 0, CURRENT_TIMESTAMP),
('calm',      '잔잔한 오후', 'Calm',      'http://localhost:8080/pg/api/audio/02_calm_inst.mp3',      132, 1, CURRENT_TIMESTAMP),
('tension',   '두근두근',    'Tension',   'http://localhost:8080/pg/api/audio/03_tension_inst.mp3',   132, 2, CURRENT_TIMESTAMP),
('cute',      '깡총깡총',    'Cute',      'http://localhost:8080/pg/api/audio/04_cute_inst.mp3',      132, 3, CURRENT_TIMESTAMP),
('mystic',    '신비한 숲',   'Mystic',    'http://localhost:8080/pg/api/audio/05_mystic_inst.mp3',    132, 4, CURRENT_TIMESTAMP),
('epic',      '웅장한 광장', 'Epic',      'http://localhost:8080/pg/api/audio/06_epic_inst.mp3',      132, 5, CURRENT_TIMESTAMP);
