# 놀이터(playground) — ERD

2026-09-25 · [기능 명세서 v2](../planning/planning.md) 기준

## 1. 개요

놀이터는 여러 보드게임을 모아 두는 허브이고, 첫 번째 게임이 **한번더(OneMoreTime)** 다. 이 문서는 그 데이터 구조를 정의한다. 각 테이블·컬럼 설명에 붙은 `1-11`, `2-9` 같은 번호는 기능 명세서의 항목 번호다.

### 이 서비스의 특이한 점

일반적인 서비스와 데이터 성격이 많이 다르다. 설계를 읽기 전에 알아야 한다.

- **계정이 없다.** 로그인하지 않고, 닉네임·아바타는 브라우저에 보관하며 중복도 허용한다. 따라서 **`users` 테이블이 없다.**
- **거의 모든 데이터가 휘발성이다.** 새로고침하면 방에서 나가고(0-4), 방이 사라지면 채팅도 함께 지워지며(M-6), 승자가 나오면 진행 상태를 버린다(3-1). 남겨서 다시 볼 데이터가 사실상 없다.
- **쓰기가 잦다.** 주사위 한 번, 한 칸 파기 한 번마다 상태가 바뀐다. 이걸 전부 RDB에 커밋하면 판당 수백 번의 트랜잭션이 생긴다.

### 그래서 무엇을 어디에 두는가

전부 테이블로 정의하되, **실제 저장 위치는 셋으로 나눈다.**

| 구분 | 테이블 | 저장 위치 | 이유 |
| --- | --- | --- | --- |
| **영속** | `games`, `game_tags` | **RDB** | 거의 안 바뀌는 게임 카탈로그 |
| **휘발** | 나머지 11개 | **서버 메모리** | 방이 사라지면 같이 사라진다. 서버가 재시작되면 진행 중인 방도 사라지는데, 명세상 허용된다 |
| **상수** | — | **코드** | 갱도 깊이 같은 게임 규칙. 테이블로 두지 않는다 ([부록 A](#부록-a-갱도-깊이-상수)) |

휘발 영역을 테이블로도 정의해 둔 이유는 두 가지다. 첫째, 메모리에 두더라도 **구조는 그대로 필요**하다(객체 그래프가 이 모양이 된다). 둘째, 나중에 전적 기록이나 재시작 복구가 필요해지면 **그대로 RDB나 Redis로 옮길 수 있다.**

#### 결정: 단일 인스턴스와 서버 메모리

검토 끝에 **Redis를 쓰지 않고 단일 인스턴스의 JVM 메모리에 둔다.**

| 이유 | 내용 |
| --- | --- |
| 영속이 필요 없다 | 새로고침하면 나가고(0-4), 방이 사라지면 채팅도 지우고(M-6), 승자가 나오면 진행 상태를 버린다(3-1). 전적도 없다 |
| 쓰기가 너무 잦다 | 주사위 한 번, 한 칸 파기 한 번마다 상태가 바뀐다. 판당 수백 번인데 **버릴 데이터를 위한 왕복**이다 |
| 로직이 객체 그래프에 맞다 | 최대 사용 규칙(2-4)은 `runners`·`camps`·`claims`를 여러 번 훑는다. Redis면 결국 메모리로 읽어와 계산하게 되고, 그러면 Redis는 느린 백업일 뿐이다 |

**Redis만으로는 다중화가 되지 않는다는 점도 판단에 넣었다.** WebSocket 연결은 특정 인스턴스에 고정된다. 같은 방의 A가 1번 서버, B가 2번 서버에 붙어 있으면 상태가 Redis에 있어도 **1번 서버는 B의 소켓에 쓸 수 없다.** 인스턴스 간 pub/sub 전파가 따로 필요하다. 즉 확장은 `Redis(상태) + pub/sub(전파) + 방 단위 락`이 한 세트라, Redis 하나 넣는다고 얻어지지 않는다.

**대신 메모리 누수를 반드시 막아야 한다.** 이것이 이 선택의 유일한 실질 비용이다.

- 마지막 참여자가 나가면 방·채팅·타이머를 함께 지운다
- 타이머 스레드를 방과 같이 취소한다 (안 하면 사라진 방의 타이머가 계속 돈다)
- 소켓이 끊겼는데 정리되지 않은 고아 방을 주기적으로 쓸어내는 스위퍼를 둔다

**언제 바꾸나** — 한 대로 감당이 안 될 때다. 그때도 Redis가 첫 수단은 아니다. 먼저 **방 단위 sticky 라우팅**(같은 방 사람은 같은 인스턴스로)으로 메모리 구조를 그대로 두고 갈 수 있고, 그래도 부족할 때 Redis + pub/sub으로 옮긴다.

> 처음부터 전부 JPA 엔티티로 만들고 싶다면 그래도 된다. 동시 접속이 적은 초기에는 문제가 안 된다. 다만 **게임 진행 중 상태(`game_*`)만큼은 메모리에 두고 턴이 끝날 때만 반영**하는 편을 권한다.

### 전제

- 방은 `ConcurrentHashMap` 같은 동시성 컬렉션으로 관리한다. 여러 소켓이 같은 방을 동시에 건드린다.
- 주사위를 포함한 모든 판정은 서버가 한다. 클라이언트가 보낸 값은 믿지 않는다.
- `playgroundback/build.gradle`에 **`spring-boot-starter-websocket`이 빠져 있다.** 실시간 동기화(5-1)를 붙이려면 추가해야 한다.

### ERD

```mermaid
erDiagram
  GAMES ||--o{ GAME_TAGS : "태그"
  GAMES ||--o{ ROOMS : "개설"

  SESSIONS ||--o| ROOM_PLAYERS : "참여"
  ROOMS ||--o{ ROOM_PLAYERS : "구성원"
  ROOMS ||--o{ CHAT_MESSAGES : "대화"
  ROOM_PLAYERS ||--o{ CHAT_MESSAGES : "작성"

  ROOMS ||--o{ GAME_ROUNDS : "판"
  GAME_ROUNDS ||--o{ GAME_SIDES : "사이드"
  GAME_SIDES ||--o{ GAME_SIDE_MEMBERS : "구성원"
  ROOM_PLAYERS ||--o| GAME_SIDE_MEMBERS : "소속"
  GAME_ROUNDS ||--o{ GAME_TURN_ORDERS : "턴 순서"
  ROOM_PLAYERS ||--o{ GAME_TURN_ORDERS : "차례"

  GAME_ROUNDS ||--o{ GAME_CAMPS : "캠프"
  GAME_SIDES ||--o{ GAME_CAMPS : "소유"
  GAME_ROUNDS ||--o{ GAME_CLAIMS : "보물"
  GAME_SIDES ||--o{ GAME_CLAIMS : "차지"
  GAME_ROUNDS ||--o{ GAME_RUNNERS : "탐험가"
  GAME_SIDES ||--o| GAME_ROUNDS : "승자"
```

---

## 2. 테이블 목록

| 영역 | 테이블 | 설명 | 저장 |
| --- | --- | --- | --- |
| 놀이터 | `games` | 놀이터에 올라가는 게임 | 영속 |
| 놀이터 | `game_tags` | 게임 카드에 붙는 태그 | 영속 |
| 접속 | `sessions` | 접속 중인 사람 | 휘발 |
| 방 | `rooms` | 게임방 | 휘발 |
| 방 | `room_players` | 방 참여자 | 휘발 |
| 방 | `chat_messages` | 방 채팅 | 휘발 |
| 게임 | `game_rounds` | 한 판의 진행 상태 | 휘발 |
| 게임 | `game_sides` | 점수 단위(개인전=사람, 팀전=팀) | 휘발 |
| 게임 | `game_side_members` | 사이드에 속한 참여자 | 휘발 |
| 게임 | `game_turn_orders` | 턴 순서 | 휘발 |
| 게임 | `game_camps` | 갱도에 설치된 캠프 | 휘발 |
| 게임 | `game_claims` | 보물을 찾은 갱도 | 휘발 |
| 게임 | `game_runners` | 이번 턴의 탐험가 | 휘발 |

### 사이드(side)를 따로 둔 이유

개인전은 **사람**이, 팀전은 **팀**이 점수를 가진다. 캠프·보물·통계가 모두 이 단위에 붙는다. 두 경우를 하나로 묶지 않으면 `side_id`가 될 자리에 `player_id`와 `team_code` 중 무엇이 들어갈지가 모드마다 갈려서, 캠프·보물 테이블이 전부 두 갈래가 된다.

`game_sides`를 두면 모드와 무관하게 **캠프도 보물도 통계도 `side_id` 하나만 본다.** 개인전이면 사이드에 구성원이 1명, 팀전이면 2명일 뿐이다.

---

## 3. 테이블 명세

### GAMES: 놀이터에 올라가는 게임 (0-6)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| code | varchar(30) | UK, NOT NULL | `onemore` 같은 코드. 클라이언트 라우팅 키 |
| name | varchar(30) | NOT NULL | 한글 이름 (한번더) |
| name_en | varchar(50) | NOT NULL | 영문 이름 (OneMoreTime). 준비 중인 카드는 `Coming Soon` |
| description | varchar(200) | NOT NULL | 카드 소개 문구 |
| thumbnail_url | varchar(500) |  | 카드 그림. 없으면 클라이언트가 기본 아이콘 표시 |
| min_players | smallint | NOT NULL | 카드에 표시할 최소 인원 |
| max_players | smallint | NOT NULL | 카드에 표시할 최대 인원 |
| play_minutes | varchar(20) |  | `15~20분` 같은 표시용 문자열 |
| is_playable | boolean | NOT NULL, DEFAULT false | false면 "준비 중" 배지 + 버튼 비활성 |
| sort_order | smallint | NOT NULL | 카드 넘김 순서 |
| created_at | timestamp | NOT NULL | 생성 시점 |
| updated_at | timestamp | NOT NULL | 최근 수정 시점 |

---

### GAME_TAGS: 게임 카드 태그 (0-6)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| game_id | bigint | FK(GAMES), NOT NULL | 대상 게임 |
| name | varchar(20) | NOT NULL | `주사위`, `운과 배짱` 등. `#`은 클라이언트가 붙인다 |
| sort_order | smallint | NOT NULL | 표시 순서 |

- UK(`game_id`, `name`) — 같은 게임에 같은 태그 중복 방지

---

### SESSIONS: 접속 중인 사람 (1-13)

로그인이 없으므로 이 테이블이 사용자 테이블을 대신한다. **소켓 연결 하나가 한 행**이다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| session_key | varchar(64) | UK, NOT NULL | 소켓/쿠키 식별자 |
| nickname | varchar(20) | NOT NULL | 브라우저 프로필 이름. **중복 허용**(M-8) |
| avatar | varchar(8) | NOT NULL | 이모지 한 글자 |
| status | varchar(10) | NOT NULL | `idle` / `lobby` / `playing` |
| current_room_id | bigint | FK(ROOMS) | 들어가 있는 방. 없으면 NULL |
| connected_at | timestamp | NOT NULL | 접속 시점 |
| last_seen_at | timestamp | NOT NULL | 마지막 신호. 끊김 판정(5-2)에 쓴다 |

- INDEX(`status`) — 접속자 목록을 상태별로 세기 위해
- 연결이 끊기면 행을 **삭제**한다. 재접속 복구가 없으므로(0-4) 남길 이유가 없다

---

### ROOMS: 게임방 (1-1)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| game_id | bigint | FK(GAMES), NOT NULL | 어떤 게임의 방인지 |
| title | varchar(30) | NOT NULL | 방 제목 |
| mode | varchar(10) | NOT NULL | `solo` / `team` (1-5) |
| max_players | smallint | NOT NULL | 개인전 2~6, 팀전 2·4·6·8 |
| is_secret | boolean | NOT NULL, DEFAULT false | 비밀방 여부 |
| password_hash | varchar(255) |  | 비밀방일 때만. **평문으로 두지 않는다** |
| status | varchar(10) | NOT NULL | `waiting` / `playing` / `closed` |
| created_at | timestamp | NOT NULL | 생성 시점 |
| closed_at | timestamp |  | 방이 사라진 시점 |

- INDEX(`game_id`, `status`) — 방 목록 조회(1-2)가 이 조합으로만 읽는다
- 방장은 `rooms`가 아니라 `room_players.is_host`로 둔다. 방장을 여기에 FK로 두면 `rooms` ↔ `room_players` 순환 참조가 생겨 삽입 순서가 꼬인다
- 마지막 참여자가 나가면 방을 삭제하고, **채팅도 함께 지운다**(M-6)

#### 비밀번호를 해시하는 이유

방 비밀번호는 개인 계정 비밀번호가 아니라 출입 암호에 가깝다. 그래도 해시한다. 사람들은 **아무 생각 없이 자기 비밀번호를 재사용하기 때문**이다. 입장 확인(1-3)은 대조만 하면 되므로 평문으로 들고 있을 이유도 없다.

---

### ROOM_PLAYERS: 방 참여자 (1-4)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| room_id | bigint | FK(ROOMS), NOT NULL | 소속 방 |
| session_id | bigint | FK(SESSIONS) | 접속 세션. 나가면 NULL |
| nickname | varchar(20) | NOT NULL | 입장 시점 이름 **스냅샷** |
| avatar | varchar(8) | NOT NULL | 입장 시점 아바타 스냅샷 |
| color_code | varchar(10) | NOT NULL | `red`/`blue`/… 8색 중 하나 (1-7) |
| team_code | char(1) |  | `A`~`D`. 팀전에서만 (1-6) |
| seat_no | smallint |  | 팀 안의 자리 `0`/`1`. 팀전에서만 |
| is_host | boolean | NOT NULL, DEFAULT false | 방장 여부 |
| is_ready | boolean | NOT NULL, DEFAULT false | 준비 여부 (1-8) |
| joined_at | timestamp | NOT NULL | 입장 시점. **방장 위임 순서**가 이 값 순이다 (1-12) |
| left_at | timestamp |  | 퇴장 시점. 채팅 기록 때문에 행 자체는 남긴다 |

- UK(`room_id`, `color_code`) WHERE `left_at` IS NULL — 개인전 색 중복 방지
- UK(`room_id`, `team_code`, `seat_no`) WHERE `left_at` IS NULL — 팀 자리 중복 방지
- UK(`room_id`) WHERE `is_host` — 방장은 방마다 한 명

#### 닉네임을 세션에서 join하지 않고 복사하는 이유

`sessions`를 참조만 하면, 참여자가 나가서 세션이 지워졌을 때 **그 사람이 남긴 채팅의 작성자가 사라진다.** 결과 화면의 팀원 이름도 마찬가지다. 입장 시점 값을 복사해 두면 나간 뒤에도 화면이 온전하다. 방 안에서 이름을 바꿀 수단이 없으므로(프로필 수정은 홈에서만) 값이 어긋날 일도 없다.

---

### CHAT_MESSAGES: 방 채팅 (0-8)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자. 정렬 키를 겸한다 |
| room_id | bigint | FK(ROOMS), NOT NULL | 소속 방 |
| room_player_id | bigint | FK(ROOM_PLAYERS), NOT NULL | 작성자 |
| nickname | varchar(20) | NOT NULL | 작성 시점 이름 스냅샷 |
| avatar | varchar(8) | NOT NULL | 작성 시점 아바타 스냅샷 |
| color_code | varchar(10) | NOT NULL | 말풍선 색 |
| body | varchar(60) | NOT NULL | 본문. 입력칸 제한과 같은 60자 |
| created_at | timestamp | NOT NULL | 작성 시점 |

- INDEX(`room_id`, `id`) — 방 단위로 순서대로만 읽는다
- 대기실과 게임이 같은 대화를 쓰므로 `room_id`에만 매달고 **화면은 구분하지 않는다**
- 개수 제한 없이 전부 보관하고, 방이 사라질 때 함께 삭제한다 (M-6)

---

### GAME_ROUNDS: 한 판의 진행 상태 (2장)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| room_id | bigint | FK(ROOMS), NOT NULL | 어느 방의 판인지 |
| status | varchar(10) | NOT NULL | `playing` / `finished` |
| phase | varchar(10) | NOT NULL | 아래 [부록 B](#부록-b-phase-값) 참고 |
| phase_deadline_at | timestamp |  | 단계 제한 시간이 끝나는 시각 (5-3). 제한 없는 단계는 NULL |
| turn_no | smallint | NOT NULL, DEFAULT 0 | 지금 차례. `game_turn_orders.turn_no`를 가리킨다 |
| dice_1 | smallint |  | 마지막으로 굴린 주사위 (2-3) |
| dice_2 | smallint |  | 〃 |
| dice_3 | smallint |  | 〃 |
| dice_4 | smallint |  | 〃 |
| rolls_this_turn | smallint | NOT NULL, DEFAULT 0 | 이번 턴에 굴린 횟수. 최장 연속 기록에 쓴다 (2-8) |
| winner_side_id | bigint | FK(GAME_SIDES) | 승자 (2-10) |
| started_at | timestamp | NOT NULL | 시작 시점 |
| finished_at | timestamp |  | 종료 시점 |

- UK(`room_id`) WHERE `status` = `'playing'` — 한 방에 진행 중인 판은 하나뿐
- 주사위를 별도 테이블로 빼지 않은 이유: 항상 정확히 4개이고, 다음 굴림에 통째로 덮어쓴다. 행으로 쪼개면 이득 없이 삭제·삽입만 늘어난다
- `phase_deadline_at`을 **남은 초가 아니라 종료 시각으로** 두는 이유: 남은 초를 저장하면 서버가 매초 써야 한다. 종료 시각은 단계가 바뀔 때 한 번만 쓰면 되고, 클라이언트도 이 값 하나로 막대를 그릴 수 있다

---

### GAME_SIDES: 점수 단위 (2-2, 3-2)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| round_id | bigint | FK(GAME_ROUNDS), NOT NULL | 소속 판 |
| side_no | smallint | NOT NULL | 헤더 참여자 칩 표시 순서 |
| label | varchar(20) | NOT NULL | 개인전은 닉네임, 팀전은 팀 이름(`빨강 팀`) |
| color_code | varchar(10) | NOT NULL | 사이드 색. 캠프·보물이 이 색으로 칠해진다 |
| team_code | char(1) |  | 팀전에서만. 개인전은 NULL |
| bust_count | smallint | NOT NULL, DEFAULT 0 | 붕괴 횟수 (2-6, 3-2) |
| max_streak | smallint | NOT NULL, DEFAULT 0 | 한 턴 최장 연속 굴림 (3-2) |

- UK(`round_id`, `side_no`)
- UK(`round_id`, `team_code`) WHERE `team_code` IS NOT NULL — 한 판에 같은 팀 사이드는 하나
- 통계를 별도 테이블로 빼지 않은 이유: 사이드마다 **항상 정확히 한 벌** 존재하고 선택적이지 않다. 1:1 테이블을 만들면 조인만 늘어난다
- 보물 개수는 컬럼으로 두지 않는다. `game_claims`를 세면 되고, 중복해서 들고 있으면 어긋날 수 있다

---

### GAME_SIDE_MEMBERS: 사이드 구성원

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| side_id | bigint | FK(GAME_SIDES), NOT NULL | 소속 사이드 |
| room_player_id | bigint | FK(ROOM_PLAYERS), NOT NULL | 참여자 |

- UK(`room_player_id`) — 한 사람은 한 판에서 한 사이드에만 속한다
- 개인전은 사이드마다 1행, 팀전은 1~2행 (팀 인원이 같아야 하는 조건은 1-11)

---

### GAME_TURN_ORDERS: 턴 순서 (1-10)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| round_id | bigint | FK(GAME_ROUNDS), NOT NULL | 소속 판 |
| turn_no | smallint | NOT NULL | 0부터 시작하는 순번 |
| room_player_id | bigint | FK(ROOM_PLAYERS), NOT NULL | 그 순번의 참여자 |

- UK(`round_id`, `turn_no`)
- UK(`round_id`, `room_player_id`) — 한 사람이 두 번 들어가지 않는다
- 시작(1-11) 때 한 번 만들고 판이 끝날 때까지 바뀌지 않는다. 팀전은 같은 팀이 연달아 오지 않도록 섞어 넣는다
- 현재 차례는 `game_rounds.turn_no`와 맞춰 읽는다. 다음 차례는 `(turn_no + 1) % 전체 수`

---

### GAME_CAMPS: 설치된 캠프 (2-8)

멈추기를 했을 때 확정되는 진행 위치다. 판이 끝날 때까지 남는다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| round_id | bigint | FK(GAME_ROUNDS), NOT NULL | 소속 판 |
| side_id | bigint | FK(GAME_SIDES), NOT NULL | 캠프 주인 |
| shaft_no | smallint | NOT NULL, CHECK 2~12 | 갱도 번호 |
| depth | smallint | NOT NULL | 현재 깊이. `1` ~ 그 갱도의 깊이([부록 A](#부록-a-갱도-깊이-상수)) |

- UK(`round_id`, `side_id`, `shaft_no`) — 한 사이드는 한 갱도에 캠프 하나
- 보물이 발견되면(2-9) **그 갱도의 다른 사이드 캠프를 삭제**한다

---

### GAME_CLAIMS: 보물을 찾은 갱도 (2-9)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| round_id | bigint | FK(GAME_ROUNDS), NOT NULL | 소속 판 |
| shaft_no | smallint | NOT NULL, CHECK 2~12 | 갱도 번호 |
| side_id | bigint | FK(GAME_SIDES), NOT NULL | 차지한 사이드 |
| claimed_at | timestamp | NOT NULL | 차지한 시점 |

- UK(`round_id`, `shaft_no`) — **갱도 하나는 한 사이드만.** 이 제약이 "이미 보물이 발견된 갱도는 누구도 못 쓴다"를 DB에서 보장한다
- 한 사이드의 행이 3개가 되면 승리 (2-10)

---

### GAME_RUNNERS: 이번 턴의 탐험가 (2-5)

한 턴 동안만 존재한다. 멈추면 캠프로 바뀌고, 붕괴하면 그냥 사라진다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | bigint | PK | 식별자 |
| round_id | bigint | FK(GAME_ROUNDS), NOT NULL | 소속 판 |
| shaft_no | smallint | NOT NULL, CHECK 2~12 | 갱도 번호 |
| depth | smallint | NOT NULL | 현재 깊이 |

- UK(`round_id`, `shaft_no`) — 한 갱도에 탐험가는 하나
- **행 수는 최대 3개**(`MAX_RUNNERS`). 이건 DB 제약으로 표현할 수 없으므로 서버가 막는다
- 사이드 컬럼이 없는 이유: 탐험가는 항상 **지금 차례인 사이드의 것**이다. 턴이 끝나면 전부 비운다

---

## 4. 부록

### 부록 A: 갱도 깊이 상수

가운데가 깊고 바깥이 얕다. 주사위 두 개의 합이 잘 나오는 숫자일수록 멀다.

| 갱도 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 깊이 | 3 | 5 | 7 | 9 | 11 | 13 | 11 | 9 | 7 | 5 | 3 |

**이 값은 테이블이 아니라 코드 상수다.** 운영 중 바뀌지 않는 게임 규칙이고, 이 값을 쓰는 판정 로직과 같이 버전 관리되어야 한다. 불변 enum 하나면 충분하다.

```java
public enum Shaft {
    S2(2, 3),  S3(3, 5),  S4(4, 7),   S5(5, 9),   S6(6, 11), S7(7, 13),
    S8(8, 11), S9(9, 9),  S10(10, 7), S11(11, 5), S12(12, 3);

    private static final Map<Integer, Shaft> BY_NO =
            Arrays.stream(values()).collect(toUnmodifiableMap(Shaft::no, s -> s));

    private final int no;
    private final int depth;

    Shaft(int no, int depth) { this.no = no; this.depth = depth; }

    public int no() { return no; }
    public int depth() { return depth; }

    /** 주사위 두 개의 합으로 갱도를 찾는다. 2~12 밖이면 예외. */
    public static Shaft of(int sum) {
        Shaft s = BY_NO.get(sum);
        if (s == null) throw new IllegalArgumentException("갱도 번호 범위 밖: " + sum);
        return s;
    }
}
```

#### 테이블로 두지 않는 이유

처음에는 `mine_shafts` 테이블로 뒀다가 뺐다. 근거가 세 가지 다 약했다.

- **"서버 검증의 기준이 된다"** — 상수로도 똑같이 검증되고, 조회가 없으니 더 빠르다. DB에서 읽더라도 결국 캐싱할 텐데, 그러면 번거로운 절차를 거친 상수일 뿐이다.
- **"코드 상수와 DB가 따로 놀지 않는다"** — 거꾸로다. 양쪽에 있으면 어긋날 수 있고, 한쪽에만 있으면 어긋날 곳이 없다.
- **"FK로 갱도 번호를 보장한다"** — `game_*`은 메모리에 두기로 했으므로 **애초에 진짜 FK가 걸리지 않는다.** 나중에 RDB로 옮기더라도 `CHECK (shaft_no BETWEEN 2 AND 12)`이면 같은 일을 하고 조인이 없다.

깊이가 범위를 넘지 않는지는 어차피 서버가 봐야 한다 ([부록 D](#부록-d-db로-막을-수-없는-규칙)).

### 부록 B: phase 값

`game_rounds.phase`와 제한 시간(5-3)의 대응이다.

| phase | 뜻 | 제한 시간 | 초과 시 |
| --- | --- | --- | --- |
| `idle` | 턴 시작, 아직 안 굴림 | 10초 | 자동 멈추기 |
| `rolling` | 주사위가 구르는 중 | 없음 | — |
| `rolled` | 조합을 고르는 중 | 15초 | 첫 번째 가능한 조합 자동 선택 |
| `digging` | 파기 연출 진행 중 | 없음 | — |
| `moved` | 판 뒤, 계속/멈추기 선택 | 10초 | 자동 멈추기 |
| `bust` | 붕괴 연출 중 | 없음 | — |
| `wait` | 턴 마무리, 다음 사람 대기 | 없음 | — |

### 부록 C: 그 밖의 enum 값

| 컬럼 | 값 |
| --- | --- |
| `rooms.mode` | `solo` / `team` |
| `rooms.status` | `waiting` / `playing` / `closed` |
| `sessions.status` | `idle`(대기 중) / `lobby`(방에 있음) / `playing`(게임 중) |
| `game_rounds.status` | `playing` / `finished` |
| `room_players.color_code` | `red` `blue` `green` `yellow` `purple` `pink` `teal` `orange` |
| `room_players.team_code` | `A`(빨강) `B`(파랑) `C`(초록) `D`(노랑) |

팀 이름은 팀 색 이름을 그대로 쓴다. 팀 색은 `color_code`의 앞 네 가지와 같은 값이다.

### 부록 D: DB로 막을 수 없는 규칙

제약으로 표현할 수 없어 **서버가 검증해야 하는** 것들이다. 놓치면 규칙이 깨진다.

| 규칙 | 근거 |
| --- | --- |
| 탐험가는 한 턴에 최대 3개 | 2-5 |
| 캠프·탐험가 깊이가 그 갱도의 깊이를 넘지 않는다 | 2-1 |
| 한 조합에서 쓸 수 있는 만큼 많이 써야 한다 (최대 사용 규칙) | 2-4 |
| 개인전 2~6명 / 팀전 2~4팀, 모든 팀의 인원이 같을 것 | 1-11 |
| 방 인원이 `rooms.max_players`를 넘지 않는다 | 1-11 |
| 보물 3개를 모으면 즉시 종료 | 2-10 |

### 부록 E: 확장 여지

지금 범위에는 없지만, 요청이 생기면 이 자리에 붙는다.

| 기능 | 필요한 것 |
| --- | --- |
| 전적 기록 | `game_results`, `game_result_sides`를 **추가 전용**으로 두고 승리 판정 때 한 번만 쓴다. 다만 계정이 없어 "누구의 전적"인지 묶을 수 없으므로, **로그인이 먼저** 필요하다 |
| 서버 재시작 복구 | 휘발 영역을 RDB나 Redis로 옮긴다. 구조는 그대로 쓸 수 있다 |
| 두 번째 게임 | `games`에 행을 추가한다. `rooms.game_id`가 이미 있으므로 방·채팅·세션은 그대로 재사용되고, `game_*` 테이블만 그 게임용으로 새로 만든다 |
| 게임 중 재접속 | `sessions`에 재접속 유예 시간을 두고 `room_players.left_at`을 되돌린다. 명세상 지금은 하지 않는다 (0-4) |
