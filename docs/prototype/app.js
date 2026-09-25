/* ===========================================================
   한번더(OneMoreTime) — 기능 명세서 기반 프로토타입
   서버 없이 한 기기에서 번갈아 플레이하는 로컬 버전
   =========================================================== */
'use strict';

/* ---------- 상수 ---------- */
const COLUMNS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const DEPTH = { 2:3, 3:5, 4:7, 5:9, 6:11, 7:13, 8:11, 9:9, 10:7, 11:5, 12:3 };
const MAX_RUNNERS = 3;
const WIN_CLAIMS = 3;
/* 단계별 제한 시간 — 단계가 바뀌면 다시 채워진다 (5-3) */
const PHASE_LIMIT = { idle: 10, moved: 10, rolled: 15 };
const SAVE_KEY = 'omt.proto.v2';

const COLORS = [
  { id: 'red',    name: '빨강', hex: '#f0553d' },
  { id: 'blue',   name: '파랑', hex: '#2d9cdb' },
  { id: 'green',  name: '초록', hex: '#5bc236' },
  { id: 'yellow', name: '노랑', hex: '#ffcf33' },
  { id: 'purple', name: '보라', hex: '#9b6bdb' },
  { id: 'pink',   name: '분홍', hex: '#ff7eb3' },
  { id: 'teal',   name: '청록', hex: '#25c2b0' },
  { id: 'orange', name: '주황', hex: '#ff9a3c' },
];   /* 팀전 정원(8명)만큼 있어야 색이 겹치지 않는다 */
/* 팀 이름은 팀 색 이름을 그대로 쓴다 (빨강 팀 / 파랑 팀 …) */
const TEAMS = ['red', 'blue', 'green', 'yellow'].map((cid, i) => {
  const c = COLORS.find((x) => x.id === cid);
  return { id: 'ABCD'[i], name: c.name + ' 팀', color: c.hex };
});
const BOT_NAMES = [
  '두더지', '곡괭이', '랜턴', '광부김', '돌쇠', '삽질왕', '수정사냥꾼', '막장이',
  '갱도지기', '카나리아', '흙강아지', '보물사냥꾼', '한삽더', '동굴박쥐', '수레끌이', '헬멧이',
];

/* 규칙 카드 — 홈 미리보기(4-1)와 규칙 오버레이가 같은 데이터를 쓴다 */
const RULES = [
  { title: "1. 목표", desc: "갱도 바닥까지 파 내려가 캠프를 치면 그 갱도의 보물을 차지한다. 보물 3개를 먼저 모으면 승리.",
    art: `<svg viewBox="0 0 96 64" aria-hidden="true">
    <rect width="96" height="64" fill="#3d2818"/>
    <rect x="0" y="8" width="96" height="5" fill="#a9743f"/>
    <rect x="10" y="13" width="18" height="30" fill="#c98d4e"/>
    <rect x="39" y="13" width="18" height="44" fill="#c98d4e"/>
    <rect x="68" y="13" width="18" height="24" fill="#c98d4e"/>
    <rect x="39" y="40" width="18" height="17" fill="#3f9fae"/>
    <path d="M19 30l7 12H12z" fill="#f0553d"/>
    <path d="M48 46l7 11H41z" fill="#f0b23c"/>
    <circle cx="48" cy="52" r="6" fill="#f0b23c" opacity=".5"/>
  </svg>` },
  { title: "2. 주사위 4개를 2개씩", desc: "굴린 4개를 2개씩 묶으면 두 개의 합이 나온다. 묶는 방법은 3가지이고, 고른 묶음의 두 합을 모두 판다.",
    art: `<svg viewBox="0 0 96 64" aria-hidden="true">
    <rect width="96" height="64" fill="#3d2818"/>
    <g fill="#fdf8ee">
      <rect x="8" y="16" width="16" height="16" rx="3"/><rect x="27" y="16" width="16" height="16" rx="3"/>
      <rect x="8" y="38" width="16" height="16" rx="3"/><rect x="27" y="38" width="16" height="16" rx="3"/>
    </g>
    <g fill="#20303a">
      <circle cx="16" cy="24" r="2.4"/>
      <circle cx="31" cy="20" r="2.4"/><circle cx="39" cy="28" r="2.4"/>
      <circle cx="12" cy="42" r="2.4"/><circle cx="20" cy="50" r="2.4"/><circle cx="16" cy="46" r="2.4"/>
      <circle cx="31" cy="42" r="2.4"/><circle cx="39" cy="42" r="2.4"/>
      <circle cx="31" cy="50" r="2.4"/><circle cx="39" cy="50" r="2.4"/>
    </g>
    <text x="52" y="29" fill="#f0b23c" font-size="14" font-weight="800">= 6</text>
    <text x="52" y="51" fill="#f0b23c" font-size="14" font-weight="800">= 7</text>
    <path d="M48 24v22" stroke="#3f9fae" stroke-width="2.5" stroke-linecap="round"/>
  </svg>` },
  { title: "3. 탐험가는 3개까지", desc: "한 턴에 쓸 수 있는 임시 말은 3개뿐. 셋을 모두 내보낸 뒤에는 새 갱도를 열 수 없다.",
    art: `<svg viewBox="0 0 96 64" aria-hidden="true">
    <rect width="96" height="64" fill="#3d2818"/>
    <rect x="0" y="8" width="96" height="5" fill="#a9743f"/>
    <rect x="8" y="13" width="18" height="40" fill="#c98d4e"/>
    <rect x="39" y="13" width="18" height="40" fill="#c98d4e"/>
    <rect x="70" y="13" width="18" height="40" fill="#c98d4e"/>
    <g fill="#f0553d">
      <path d="M17 26c4 0 6 3 6 6s-2 6-6 6-6-3-6-6 2-6 6-6z"/>
      <path d="M48 32c4 0 6 3 6 6s-2 6-6 6-6-3-6-6 2-6 6-6z"/>
      <path d="M79 22c4 0 6 3 6 6s-2 6-6 6-6-3-6-6 2-6 6-6z"/>
    </g>
    <text x="30" y="61" fill="#f0b23c" font-size="10" font-weight="800">최대 3개</text>
  </svg>` },
  { title: "4. 붕괴 주의", desc: "굴린 결과로 탐험가를 어떻게도 움직일 수 없으면 붕괴. 이번 턴에 판 것이 전부 사라진다.",
    art: `<svg viewBox="0 0 96 64" aria-hidden="true">
    <rect width="96" height="64" fill="#3d2818"/>
    <rect x="0" y="8" width="96" height="5" fill="#a9743f"/>
    <rect x="0" y="13" width="96" height="51" fill="#7a6049"/>
    <path d="M12 56l11-16 11 16zM40 56l13-21 13 21z" fill="#c98d4e"/>
    <circle cx="76" cy="30" r="8" fill="#c98d4e"/>
    <text x="14" y="34" fill="#f0553d" font-size="24" font-weight="800">!</text>
  </svg>` },
  { title: "5. 멈추기 = 캠프", desc: "멈추면 탐험가가 있던 자리에 캠프가 서고 진행이 확정된다. 한번 더 굴릴지, 여기서 멈출지가 이 게임의 전부다.",
    art: `<svg viewBox="0 0 96 64" aria-hidden="true">
    <rect width="96" height="64" fill="#3d2818"/>
    <rect x="0" y="8" width="96" height="5" fill="#a9743f"/>
    <rect x="0" y="13" width="96" height="51" fill="#c98d4e"/>
    <path d="M22 20c5 0 8 4 8 8s-3 8-8 8-8-4-8-8 3-8 8-8z" fill="#f0553d"/>
    <path d="M30 40h4l-2-6z" fill="#fdf8ee" opacity=".5"/>
    <path d="M60 24l14 26H46z" fill="#f0553d"/>
    <path d="M60 36l5 14h-10z" fill="#20303a" opacity=".35"/>
    <path d="M36 32h12M44 28l5 4-5 4" stroke="#f0b23c" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>` },
  { title: "6. 시간 제한", desc: "주사위를 굴리기까지 10초, 조합을 고르는 데 15초. 단계가 바뀔 때마다 다시 채워지고, 넘기면 자동으로 처리된다.",
    art: `<svg viewBox="0 0 96 64" aria-hidden="true">
    <rect width="96" height="64" fill="#3d2818"/>
    <rect x="10" y="16" width="76" height="8" rx="4" fill="#7a6049"/>
    <rect x="10" y="16" width="30" height="8" rx="4" fill="#5bc236"/>
    <text x="10" y="38" fill="#fdf8ee" font-size="10" font-weight="800">굴리기 10초</text>
    <rect x="10" y="44" width="76" height="8" rx="4" fill="#7a6049"/>
    <rect x="10" y="44" width="56" height="8" rx="4" fill="#5bc236"/>
    <text x="10" y="62" fill="#fdf8ee" font-size="10" font-weight="800">고르기 15초</text>
  </svg>` },
];

const ART_SOON = '<img src="image/coming-soon.webp" alt="준비 중" loading="lazy" decoding="async">';

/* 놀이터에 올라가는 게임 목록 — 게임을 추가하려면 여기에 한 줄 추가한다.
   art 는 카드 상단 그림: <img> 나 인라인 <svg> 를 넣고, 없으면 icon 이 크게 표시된다. */
const GAMES = [
  /* 게임이 아니라 소통 공간. 카드를 누르면 놀이터로 들어간다 */
  { id: 'plaza', name: '놀이터', en: 'Plaza', icon: '🛝', tone: '#5bc236', ready: true,
    cta: '입장하기', badge: '상시 열림',
    art: `<svg viewBox="0 0 320 180" aria-hidden="true">
      <rect width="320" height="180" fill="#9fd9f2"/>
      <circle cx="268" cy="36" r="22" fill="#ffcf33"/>
      <ellipse cx="60" cy="40" rx="34" ry="14" fill="#fff" opacity=".92"/>
      <ellipse cx="150" cy="26" rx="26" ry="11" fill="#fff" opacity=".85"/>
      <path d="M0 112q80-42 170-18 80 21 150-6v92H0z" fill="#7ec74a"/>
      <rect y="126" width="320" height="54" fill="#63b93a"/>
      <ellipse cx="160" cy="150" rx="104" ry="26" fill="#eed8ae"/>
      <g fill="#a9743f"><rect x="46" y="86" width="7" height="34" rx="3"/><rect x="262" y="92" width="7" height="30" rx="3"/></g>
      <circle cx="50" cy="78" r="22" fill="#5bc236"/><circle cx="34" cy="90" r="14" fill="#4aa81f"/>
      <circle cx="266" cy="84" r="19" fill="#4aa81f"/><circle cx="280" cy="94" r="12" fill="#5bc236"/>
      <ellipse cx="160" cy="140" rx="30" ry="10" fill="#7fc9ec"/>
      <rect x="155" y="112" width="10" height="24" rx="5" fill="#eaf1f4"/>
      <ellipse cx="160" cy="112" rx="15" ry="5" fill="#eaf1f4"/>
      <g>
        <ellipse cx="112" cy="156" rx="13" ry="4" fill="#20303a" opacity=".2"/>
        <path d="M112 128a13 15 0 0 1 13 15v5a13 10 0 0 1-26 0v-5a13 15 0 0 1 13-15z" fill="#f0553d"/>
        <ellipse cx="204" cy="162" rx="13" ry="4" fill="#20303a" opacity=".2"/>
        <path d="M204 134a13 15 0 0 1 13 15v5a13 10 0 0 1-26 0v-5a13 15 0 0 1 13-15z" fill="#2d9cdb"/>
        <ellipse cx="160" cy="170" rx="13" ry="4" fill="#20303a" opacity=".2"/>
        <path d="M160 142a13 15 0 0 1 13 15v5a13 10 0 0 1-26 0v-5a13 15 0 0 1 13-15z" fill="#9b6bdb"/>
      </g>
    </svg>`,
    desc: '캐릭터를 움직이며 다른 사람들과 이야기하는 공간. 게임이 아니라 그냥 모이는 곳이다',
    tags: ['소통', '자유 이동', '채팅'],
    players: '제한 없음', time: '자유' },
  { id: 'onemore', name: '한번더', en: 'OneMoreTime', icon: '⛏', tone: '#f0553d', ready: true,
    art: '<img src="image/omt-thumb.webp" alt="한번더 썸네일" loading="lazy" decoding="async">',
    desc: '주사위 4개로 11개의 갱도를 파내려가, 가장 깊은 곳의 보물 3개를 먼저 찾는 사람이 이긴다',
    tags: ['주사위', '운과 배짱', '쉬운 규칙'],
    players: '2~6명', time: '15~20분' },
  { id: 'game2', name: '게임 2', en: 'Coming Soon', icon: '🎲', tone: '#2d9cdb', ready: false, art: ART_SOON,
    desc: '다음 게임을 준비하고 있습니다', players: '—', time: '—' },
  { id: 'game3', name: '게임 3', en: 'Coming Soon', icon: '🃏', tone: '#5bc236', ready: false, art: ART_SOON,
    desc: '다음 게임을 준비하고 있습니다', players: '—', time: '—' },
  { id: 'game4', name: '게임 4', en: 'Coming Soon', icon: '🧩', tone: '#9b6bdb', ready: false, art: ART_SOON,
    desc: '다음 게임을 준비하고 있습니다', players: '—', time: '—' },
];
const PIPS = {
  1: [[2,2]],
  2: [[1,1],[3,3]],
  3: [[1,1],[2,2],[3,3]],
  4: [[1,1],[1,3],[3,1],[3,3]],
  5: [[1,1],[1,3],[2,2],[3,1],[3,3]],
  6: [[1,1],[1,3],[2,1],[2,3],[3,1],[3,3]],
};

/* ---------- 유틸 ---------- */
const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const d6 = () => 1 + Math.floor(Math.random() * 6);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* 한글 입력 중 Enter 는 조합을 확정하는 키다. 이때 전송하면 확정된 글자가
   비워진 입력칸에 다시 들어가 한 글자가 남는다 */
const isComposing = (e) => e.isComposing || e.keyCode === 229;
const colorHex = (id) => (COLORS.find((c) => c.id === id) || COLORS[0]).hex;
const teamOf = (id) => TEAMS.find((t) => t.id === id);

/* ---------- 설정 (4-2, 4-3) ---------- */
const S = {
  sound: true, speed: 'normal', timer: true, spec: false,
  load() {
    try { Object.assign(this, JSON.parse(localStorage.getItem(SAVE_KEY + '.set') || '{}')); } catch {}
    this.apply();
  },
  save() {
    try { localStorage.setItem(SAVE_KEY + '.set', JSON.stringify({ sound: this.sound, speed: this.speed, timer: this.timer, spec: this.spec })); } catch {}
    this.apply();
  },
  apply() {
    document.documentElement.style.setProperty('--anim', this.speed === 'fast' ? '2' : '1');
    document.body.classList.toggle('show-spec', this.spec);
    $('#set-sound').classList.toggle('on', this.sound);
    $('#set-timer').classList.toggle('on', this.timer);
    $('#set-spec').classList.toggle('on', this.spec);
    $$('#set-speed button').forEach((b) => b.classList.toggle('on', b.dataset.speed === this.speed));
  },
  ms(base) { return this.speed === 'fast' ? Math.round(base * 0.5) : base; },
};

/* ---------- 사운드 (0-5) ---------- */
const Sound = {
  ctx: null,
  ensure() {
    if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur, { type = 'sine', gain = 0.06, at = 0, slide = 0 } = {}) {
    const ctx = this.ctx; if (!ctx) return;
    const t0 = ctx.currentTime + at;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  },
  play(name) {
    if (!S.sound || !this.ensure()) return;
    switch (name) {
      case 'click':    this.tone(420, 0.05, { type: 'square', gain: 0.03 }); break;
      case 'roll':     for (let i = 0; i < 5; i++) this.tone(180 + Math.random() * 260, 0.06, { type: 'triangle', gain: 0.045, at: i * 0.06 }); break;
      case 'dig':      this.tone(300, 0.09, { type: 'square', gain: 0.05, slide: -140 }); this.tone(150, 0.14, { type: 'sine', gain: 0.05, at: 0.03 }); break;
      case 'bust':     [320, 250, 190, 120].forEach((f, i) => this.tone(f, 0.22, { type: 'sawtooth', gain: 0.06, at: i * 0.1, slide: -60 })); break;
      case 'treasure': [660, 880, 1170].forEach((f, i) => this.tone(f, 0.22, { type: 'sine', gain: 0.06, at: i * 0.08 })); break;
      case 'turn':     this.tone(520, 0.1, { type: 'sine', gain: 0.04 }); this.tone(780, 0.12, { type: 'sine', gain: 0.035, at: 0.08 }); break;
      case 'join':     this.tone(600, 0.08, { type: 'triangle', gain: 0.04 }); this.tone(900, 0.1, { type: 'triangle', gain: 0.035, at: 0.06 }); break;
      case 'win':      [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.35, { type: 'sine', gain: 0.07, at: i * 0.12 })); break;
    }
  },
};

/* ---------- 토스트 (0-2) ---------- */
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind;
  el.textContent = msg;
  $('#toast-area').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, S.ms(2000));
}

/* ---------- 확인 다이얼로그 ---------- */
function confirmBox(title, msg, okText = '확인') {
  return new Promise((resolve) => {
    $('#dlg-title').textContent = title;
    $('#dlg-msg').textContent = msg;
    $('#dlg-yes').textContent = okText;
    $('#dialog').hidden = false;
    const done = (v) => { $('#dialog').hidden = true; $('#dlg-yes').onclick = null; $('#dlg-no').onclick = null; resolve(v); };
    $('#dlg-yes').onclick = () => done(true);
    $('#dlg-no').onclick = () => done(false);
  });
}

/* ---------- 화면 전환 (0-1) ---------- */
function show(name) {
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'screen-' + name));
  if (G) G.screen = name;
  document.body.dataset.screen = name;        /* 채팅 위치를 화면에 맞춘다 */
  if (name !== 'lobby' && name !== 'game') toggleChat(false, true);
  if (name === 'lobby') startStage(); else stopStage();
  if (name !== 'plaza') stopPlaza();          /* 놀이터를 벗어나면 루프를 멈춘다 */
}

/* ===========================================================
   상태
   =========================================================== */
let G = null;
const justMoved = new Set();
const justClaimed = new Set();
let timerId = null;
let seq = 0;

function newRoom(hostName) {
  seq = 0;
  const host = makePlayer(hostName, true);
  return {
    screen: 'lobby',
    title: `${hostName}의 방`, max: 6, secret: false, password: '',
    mode: 'solo',
    players: [host],
    meId: host.id,
    order: [], turn: 0,
    phase: 'idle', dice: [1, 1, 1, 1], options: [],
    runners: {}, markers: {}, claimed: {}, stats: {},
    rollsThisTurn: 0, turnLeft: 0,
    started: false, finished: false, winner: null,
  };
}
function makePlayer(name, isHost = false) {
  return {
    id: 'p' + (++seq), name: name || '광부' + seq,
    color: freeColor(), emoji: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    team: null, ready: false, host: isHost,
  };
}
function freeColor() {
  const used = new Set((G?.players || []).map((p) => p.color));
  return (COLORS.find((c) => !used.has(c.id)) || COLORS[0]).id;
}
const player = (id) => G.players.find((p) => p.id === id);
const me = () => player(G.meId) || G.players[0];
const currentPlayer = () => player(G.order[G.turn]);
const currentSide = () => sideOf(G.order[G.turn]);

function sideOf(playerId) {
  const p = player(playerId);
  return G.mode === 'team' ? 'T' + p.team : p.id;
}
function sideInfo(sid) {
  if (sid && sid[0] === 'T') { const t = teamOf(sid.slice(1)); return { name: t.name, color: t.color }; }
  const p = player(sid);
  return { name: p ? p.name : '?', color: p ? colorHex(p.color) : '#888' };
}
function allSides() {
  const out = [];
  for (const pid of G.order) { const s = sideOf(pid); if (!out.includes(s)) out.push(s); }
  return out;
}
function stats(sid) { return (G.stats[sid] ||= { busts: 0, maxStreak: 0 }); }
function claimCount(sid) { return Object.values(G.claimed).filter((v) => v === sid).length; }

/* ---------- 저장 / 재접속 (0-3, 0-4) ---------- */
function save() { try { if (G) localStorage.setItem(SAVE_KEY, JSON.stringify({ ...G, seq })); } catch {} }
function clearSaved() { try { localStorage.removeItem(SAVE_KEY); } catch {} }
function loadSaved() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; } }

/* ===========================================================
   갱도 규칙
   =========================================================== */
function posOf(col, runners, side) {
  if (runners[col] != null) return runners[col];
  return (G.markers[side] && G.markers[side][col]) || 0;
}
function canUse(col, runners, side) {
  if (!DEPTH[col]) return false;
  if (G.claimed[col] != null) return false;                                   // 보물 발견된 갱도 (2-9)
  if (runners[col] == null && Object.keys(runners).length >= MAX_RUNNERS) return false; // 탐험가 3개 제한 (2-5)
  return posOf(col, runners, side) < DEPTH[col];
}
function applyUse(col, runners, side) { runners[col] = posOf(col, runners, side) + 1; }

/* 3가지 페어링 계산 (2-4) — 각 페어링에서 "가능한 만큼 많이" 쓰는 수를 고른다 */
function computePairings(side) {
  const d = G.dice;
  const idx = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
  return idx.map(([p, q]) => {
    const a = d[p[0]] + d[p[1]];
    const b = d[q[0]] + d[q[1]];
    const cands = [];
    for (const [x, y] of [[a, b], [b, a]]) {
      const t = { ...G.runners }; const used = [];
      if (canUse(x, t, side)) { applyUse(x, t, side); used.push(x); }
      if (canUse(y, t, side)) { applyUse(y, t, side); used.push(y); }
      cands.push(used);
    }
    const max = Math.max(cands[0].length, cands[1].length);
    const plays = []; const seen = new Set();
    if (max > 0) {
      for (const c of cands) {
        if (c.length !== max) continue;
        const key = [...c].sort((m, n) => m - n).join('-');
        if (seen.has(key)) continue;
        seen.add(key); plays.push(c);
      }
    }
    return { a, b, plays, faces: [[d[p[0]], d[p[1]]], [d[q[0]], d[q[1]]]] };
  });
}

/* ===========================================================
   놀이터 (메인) — 게임 선택
   =========================================================== */
/* 좌우로 넘기는 카드 트랙 — 놀이터 게임 카드와 홈 규칙 미리보기가 함께 쓴다 */
function makeCarousel(track, dots) {
  const index = () => {
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    [...track.children].forEach((el, i) => {
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  };
  const sync = () => {
    const i = index();
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i));
  };
  const go = (i) => {
    const el = track.children[Math.max(0, Math.min(track.children.length - 1, i))];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };
  track.addEventListener('scroll', sync);
  dots.addEventListener('click', (e) => {
    const d = e.target.closest('[data-dot]'); if (d) go(Number(d.dataset.dot));
  });
  return { index, sync, go };
}
const dotsHtml = (items, label) => items
  .map((it, i) => `<button class="dot ${i === 0 ? 'on' : ''}" data-dot="${i}" title="${esc(label(it))}"></button>`)
  .join('');

const pgCarousel = makeCarousel($('#game-track'), $('#game-dots'));

function renderPlayground() {
  const saved = loadSaved();
  const track = $('#game-track');
  const keep = track.scrollLeft;

  track.innerHTML = GAMES.map((g) => {
    let badge = g.ready ? '<span class="badge live">플레이 가능</span>' : '<span class="badge">준비 중</span>';
    if (g.badge) badge = `<span class="badge live">${esc(g.badge)}</span>`;
    if (g.id === 'onemore' && saved) badge = `<span class="badge resume">${saved.started ? '진행 중' : '대기실'}</span>`;
    return `<article class="gcard ${g.ready ? '' : 'soon'}">
      <div class="gcard-art ${g.art ? 'has-art' : ''}" style="background:${g.tone}">
        ${g.art || `<span class="gcard-icon">${g.icon}</span>`}
      </div>
      <div class="gcard-body">
        <div class="gcard-title"><b>${esc(g.name)}</b><span class="gcard-en">${g.en}</span>${badge}</div>
        <p class="gcard-desc">${esc(g.desc)}</p>
        ${g.tags?.length ? `<div class="gcard-tags">${g.tags.map((t) => `<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="gcard-meta"><span>👥 ${g.players}</span><span>⏱ ${g.time}</span></div>
        <button class="btn ${g.ready ? 'primary' : ''} big" data-game="${g.id}" ${g.ready ? '' : 'disabled'}>
          ${g.cta || (g.ready ? '플레이' : '준비 중')}
        </button>
      </div>
    </article>`;
  }).join('');

  $('#game-dots').innerHTML = dotsHtml(GAMES, (g) => g.name);

  track.style.scrollBehavior = 'auto';   /* 재렌더로 0이 된 스크롤을 애니메이션 없이 복원 */
  track.scrollLeft = keep;
  track.style.scrollBehavior = '';
  pgCarousel.sync();
}

$('#game-track').onclick = (e) => {
  const b = e.target.closest('[data-game]'); if (!b || b.disabled) return;
  Sound.play('click');
  if (b.dataset.game === 'plaza') { openPlaza(); return; }
  refreshHome();
  show('home');
};
$('#btn-prev').onclick = () => pgCarousel.go(pgCarousel.index() - 1);
$('#btn-next').onclick = () => pgCarousel.go(pgCarousel.index() + 1);

document.addEventListener('keydown', (e) => {
  if (!$('#screen-playground').classList.contains('active')) return;
  if (!$('#overlay-rules').hidden) return;          /* 규칙 모달이 화살표를 가져간다 */
  if (e.key === 'ArrowLeft') pgCarousel.go(pgCarousel.index() - 1);
  if (e.key === 'ArrowRight') pgCarousel.go(pgCarousel.index() + 1);
});

$('#btn-to-playground').onclick = () => { renderPlayground(); show('playground'); };

/* ===========================================================
   규칙 (4-1) — 홈 미리보기와 오버레이가 RULES 하나를 공유한다
   =========================================================== */
const ruleCarousel = makeCarousel($('#rule-track'), $('#rule-dots'));

function renderRules() {
  $('#rule-track').innerHTML = RULES.map((r) => `
    <article class="rule-card">${r.art}<h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p></article>`).join('');
  $('#rule-dots').innerHTML = dotsHtml(RULES, (r) => r.title);
  ruleCarousel.sync();
}

function openRules() {
  const track = $('#rule-track');
  $('#overlay-rules').hidden = false;
  track.style.scrollBehavior = 'auto';    /* 열 때마다 1번 규칙부터 */
  track.scrollLeft = 0;
  track.style.scrollBehavior = '';
  ruleCarousel.sync();
  Sound.play('click');
}

$('#btn-rule-prev').onclick = () => ruleCarousel.go(ruleCarousel.index() - 1);
$('#btn-rule-next').onclick = () => ruleCarousel.go(ruleCarousel.index() + 1);

document.addEventListener('keydown', (e) => {
  if ($('#overlay-rules').hidden) return;
  if (e.key === 'ArrowLeft') ruleCarousel.go(ruleCarousel.index() - 1);
  if (e.key === 'ArrowRight') ruleCarousel.go(ruleCarousel.index() + 1);
  if (e.key === 'Escape') $('#overlay-rules').hidden = true;
});

/* ===========================================================
   한번더 — 홈
   =========================================================== */
/* ---------- 내 프로필 (이름 + 이모지 아바타) ---------- */
const PROFILE_KEY = SAVE_KEY + '.profile';
const AVATARS = ['⛏', '💎', '🔦', '🪨', '⭐', '🔥', '🍀', '🧭',
                 '🐹', '🦊', '🐻', '🐸', '🐧', '🦉', '🐢', '🦔'];
const profile = { nick: '', emoji: '⛏' };

/* 이름 배열에서 하나 + 네 자리 숫자 */
const randomNick = () =>
  BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + (1000 + Math.floor(Math.random() * 9000));

try { Object.assign(profile, JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')); } catch {}
function saveProfile() { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {} }
const lastNick = () => profile.nick;

if (!profile.nick) { profile.nick = randomNick(); saveProfile(); }

function renderProfile() {
  const html = `
    <button class="pf-name" data-pf="edit" title="이름 수정">${esc(profile.nick)}</button>
    <button class="pf-avatar" data-pf="avatar" title="프로필 사진 변경">${profile.emoji}</button>`;
  $$('.profile').forEach((el) => (el.innerHTML = html));
}

$$('.profile').forEach((el) => (el.onclick = async (e) => {
  const b = e.target.closest('[data-pf]'); if (!b) return;
  if (b.dataset.pf === 'edit') {
    const v = await askNick('이름 수정', '다른 참여자에게 보이는 이름입니다', '저장');
    if (v) { renderProfile(); renderOnline(); pzSyncMe(); toast('이름을 바꿨습니다'); }
  } else {
    renderAvatars();
    $('#overlay-avatar').hidden = false;
    Sound.play('click');
  }
}));

function renderAvatars() {
  $('#avatar-grid').innerHTML = AVATARS.map((a) =>
    `<button class="avatar-opt ${a === profile.emoji ? 'on' : ''}" data-avatar="${a}">${a}</button>`).join('');
}

$('#avatar-grid').onclick = (e) => {
  const b = e.target.closest('[data-avatar]'); if (!b) return;
  profile.emoji = b.dataset.avatar;
  saveProfile();
  renderProfile(); renderOnline(); pzSyncMe();
  $('#overlay-avatar').hidden = true;
  Sound.play('join');
  toast('프로필 사진을 바꿨습니다');
};

/* 닉네임 설정 모달 — 프로필 수정, 방 만들기, 방 입장이 함께 쓴다 */

function askNick(title, sub, okText) {
  return new Promise((resolve) => {
    $('#nick-title').textContent = title;
    $('#nick-sub').textContent = sub;
    $('#nick-ok').textContent = okText;
    $('#nick-input').value = lastNick();
    $('#overlay-nick').hidden = false;
    setTimeout(() => $('#nick-input').select(), 40);

    const close = (v) => {
      $('#overlay-nick').hidden = true;
      $('#nick-ok').onclick = $('#nick-cancel').onclick = $('#nick-close').onclick = null;
      $('#nick-input').onkeydown = null;
      resolve(v);
    };
    const confirm = () => {
      const v = $('#nick-input').value.trim();
      if (!v) { toast('닉네임을 입력해 주세요', 'bad'); $('#nick-input').focus(); return; }
      profile.nick = v; saveProfile();
      close(v);
    };
    $('#nick-random').onclick = () => { $('#nick-input').value = randomNick(); $('#nick-input').focus(); };
    $('#nick-ok').onclick = confirm;
    $('#nick-cancel').onclick = $('#nick-close').onclick = () => close(null);
    $('#nick-input').onkeydown = (e) => {
      if (isComposing(e)) return;
      if (e.key === 'Enter') confirm();
      if (e.key === 'Escape') close(null);
    };
  });
}

/* 열려 있는 방 목록 — 서버가 없으므로 모의 데이터로 채운다 */
let openRooms = [];

const MOCK_PW = '1234';
const ROOM_TITLES = ['초보 환영', '빠른 한판', '고인물만', '같이 파요', '한판만 더',
                     '보물 찾으러', '심심해요', '갱도 탐험대', '퇴근 후 한판', '조용히 합시다'];

function seedRooms() {
  const pool = shuffle([...BOT_NAMES]);
  const titles = shuffle([...ROOM_TITLES]);
  const states = ['wait', 'wait', 'wait', 'wait', 'full', 'playing'];
  openRooms = Array.from({ length: 11 }, (_, i) => {
    const mode = Math.random() < 0.3 ? 'team' : 'solo';
    const max = mode === 'team' ? [4, 6, 8][Math.floor(Math.random() * 3)] : 4 + Math.floor(Math.random() * 3);
    const state = states[Math.floor(Math.random() * states.length)];
    const members = state === 'full' ? max
      : state === 'playing' ? 2 + Math.floor(Math.random() * (max - 2))
      : 1 + Math.floor(Math.random() * (max - 2));   /* 대기 방은 항상 빈자리가 남는다 */
    const host = pool[i % pool.length];
    const secret = Math.random() < 0.3;
    return {
      host, mode, max, members, state, secret,
      password: secret ? MOCK_PW : '',
      title: titles[i % titles.length] || `${host}의 방`,
    };
  });
  /* 비밀방 기능이 항상 보이도록 최소 한 개는 보장한다 */
  if (!openRooms.some((r) => r.secret)) {
    const target = openRooms.find((r) => r.state === 'wait') || openRooms[0];
    target.secret = true;
    target.password = MOCK_PW;
  }
  roomPage = 0;
}

/* 2열 × 3행 고정 */
const ROOM_PAGE_SIZE = 6;
let roomPage = 0;

function renderRooms() {
  const size = ROOM_PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(openRooms.length / size));
  roomPage = Math.max(0, Math.min(roomPage, pages - 1));
  const from = roomPage * size;

  $('#room-list').innerHTML = openRooms.slice(from, from + size).map((r, k) => {
    const i = from + k;
    const badge = r.state === 'playing' ? '<span class="badge">게임 중</span>'
      : r.state === 'full' ? '<span class="badge">정원 초과</span>'
      : '<span class="badge live">대기 중</span>';
    const seats = Array.from({ length: r.max }, (_, k) =>
      `<i class="seat ${k < r.members ? 'on' : ''}"></i>`).join('');
    return `<li>
      <button class="room-card ${r.state === 'wait' ? '' : 'off'}" data-room="${i}">
        <span class="room-top">
          <span class="room-icon">${r.mode === 'team' ? '🤝' : '⛏'}</span>
          ${r.secret ? '<span class="room-lock" title="비밀방">🔒</span>' : ''}
          ${badge}
        </span>
        <b class="room-name">${esc(r.title)}</b>
        <span class="room-meta">${esc(r.host)} · ${r.mode === 'team' ? '팀전' : '개인전'} · ${r.members}/${r.max}명</span>
        <span class="room-seats">${seats}</span>
        <span class="room-foot">
          <span class="room-go">${r.state === 'wait' ? '입장 ›' : ''}</span>
        </span>
      </button>
    </li>`;
  }).join('');

  $('#room-pager').classList.toggle('hidden', pages <= 1);
  $('#room-page-label').textContent = `${roomPage + 1} / ${pages}`;
  $('#btn-room-prev').disabled = roomPage === 0;
  $('#btn-room-next').disabled = roomPage >= pages - 1;
}

function goRoomPage(d) { roomPage += d; renderRooms(); Sound.play('click'); }
$('#btn-room-prev').onclick = () => goRoomPage(-1);
$('#btn-room-next').onclick = () => goRoomPage(1);

/* 접속 중인 사람 — 서버가 없으므로 모의 데이터 */
const ONLINE_STATE = {
  idle:    { label: '대기 중', tone: 'var(--green)' },
  lobby:   { label: '방에 있음', tone: 'var(--yellow)' },
  playing: { label: '게임 중', tone: 'var(--text-mute)' },
};
let onlineUsers = [];

function seedOnline() {
  const states = ['idle', 'lobby', 'playing'];
  onlineUsers = shuffle([...BOT_NAMES]).map((name) => ({
    name,
    state: states[Math.floor(Math.random() * states.length)],
    emoji: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  }));
}

function renderOnline() {
  const rows = [{ name: profile.nick, emoji: profile.emoji, state: 'idle', me: true }, ...onlineUsers];

  $('#online-count').textContent = `${rows.length}명`;
  $('#online-list').innerHTML = rows.map((u) => {
    const st = ONLINE_STATE[u.state];
    return `<li class="online-row">
      <span class="online-avatar">${u.emoji}</span>
      <span class="p-id">
        <span class="online-name">${esc(u.name)}</span>
        <i class="p-dot" style="background:${st.tone}" title="${st.label}"></i>
      </span>
      ${u.me ? '<span class="p-tag me">나</span>' : ''}
      <span class="online-state">${st.label}</span>
    </li>`;
  }).join('');
}

$('#btn-refresh-rooms').onclick = () => {
  seedRooms(); seedOnline(); renderRooms(); renderOnline();
  Sound.play('click'); toast('목록을 새로고침했습니다');
};

$('#room-list').onclick = async (e) => {
  const b = e.target.closest('[data-room]'); if (!b) return;
  const r = openRooms[Number(b.dataset.room)];
  if (r.state === 'playing') { toast('이미 게임이 진행 중인 방입니다', 'bad'); return; }
  if (r.state === 'full') { toast('정원이 가득 찼습니다', 'bad'); return; }
  if (r.secret && !await askPassword(r)) return;
  enterRoom(r, profile.nick);
};

/* 비밀방 비밀번호 확인 — 맞을 때까지 모달을 유지한다 */
function askPassword(room) {
  return new Promise((resolve) => {
    $('#pw-input').value = '';
    $('#overlay-pw').hidden = false;
    setTimeout(() => $('#pw-input').focus(), 40);

    const close = (v) => {
      $('#overlay-pw').hidden = true;
      $('#pw-ok').onclick = $('#pw-cancel').onclick = $('#pw-close').onclick = null;
      $('#pw-input').onkeydown = null;
      resolve(v);
    };
    const submit = () => {
      if ($('#pw-input').value.trim() === room.password) { Sound.play('join'); close(true); return; }
      toast('비밀번호가 맞지 않습니다', 'bad');
      Sound.play('bust');
      $('#pw-input').value = '';
      $('#pw-input').focus();
    };
    $('#pw-ok').onclick = submit;
    $('#pw-cancel').onclick = $('#pw-close').onclick = () => close(false);
    $('#pw-input').onkeydown = (e) => {
      if (isComposing(e)) return;
      if (e.key === 'Enter') submit();
      if (e.key === 'Escape') close(false);
    };
  });
}

/* 모의 방에 입장 — 방장과 기존 참여자를 만들어 대기실을 채운다 */
function enterRoom(room, nick) {
  G = null; G = newRoom(room.host);
  G.mode = room.mode;
  G.title = room.title;
  G.max = room.max;
  G.secret = room.secret;
  G.password = room.password;
  G.players[0].ready = true;

  const pool = shuffle(BOT_NAMES.filter((n) => n !== room.host));
  for (let i = 1; i < room.members; i++) {
    const p = makePlayer(pool[i - 1]);
    p.ready = true;
    G.players.push(p);
  }
  const mine = makePlayer(nick);
  mine.emoji = profile.emoji;
  G.players.push(mine);
  G.meId = mine.id;
  if (G.mode === 'team') G.players.forEach((p) => { if (!p.team) assignSeat(p); });

  G.chat = [];
  G.players.filter((p) => p.id !== G.meId).slice(0, 2).forEach((p, i) => {
    G.chat.push({
      name: p.name, emoji: p.emoji, me: false,
      text: GREETINGS[(i + Math.floor(Math.random() * 3)) % GREETINGS.length],
      color: G.mode === 'team' && p.team ? teamOf(p.team).color : colorHex(p.color),
    });
  });

  Sound.play('join');
  renderLobby(); show('lobby'); save();
  toast(`"${room.title}" 방에 입장했습니다`);
}

/* ---------- 방 만들기 (1-1) ---------- */
let createMode = 'solo';
let createMax = 6;
let createSecret = false;

/* 개인전은 2~6명, 팀전은 팀 인원이 같아야 해서 짝수만 고를 수 있다 (2 = 1대1) */
const maxChoices = () => (createMode === 'team' ? [2, 4, 6, 8] : [2, 3, 4, 5, 6]);

function renderMaxChoices() {
  $('#create-max').innerHTML = maxChoices()
    .map((n) => `<button data-max="${n}" class="${n === createMax ? 'on' : ''}">${n}</button>`).join('');
}

$('#create-mode').onclick = (e) => {
  const b = e.target.closest('[data-mode]'); if (!b) return;
  createMode = b.dataset.mode;
  $$('#create-mode button').forEach((x) => x.classList.toggle('on', x.dataset.mode === createMode));
  const opts = maxChoices();                     /* 모드가 바뀌면 가장 가까운 정원으로 맞춘다 */
  if (!opts.includes(createMax)) {
    createMax = opts.reduce((a, b2) => (Math.abs(b2 - createMax) < Math.abs(a - createMax) ? b2 : a));
  }
  renderMaxChoices(); Sound.play('click');
};
$('#create-max').onclick = (e) => {
  const b = e.target.closest('[data-max]'); if (!b) return;
  createMax = Number(b.dataset.max); renderMaxChoices(); Sound.play('click');
};
$('#create-secret').onclick = () => {
  createSecret = !createSecret;
  $('#create-secret').classList.toggle('on', createSecret);
  $('#create-pw-field').classList.toggle('hidden', !createSecret);
  if (createSecret) $('#create-pw').focus();
  Sound.play('click');
};

$('#btn-create').onclick = () => {
  createMode = 'solo'; createMax = 6; createSecret = false;
  $('#create-title').value = `${profile.nick}의 방`;
  $('#create-pw').value = '';
  $('#create-secret').classList.remove('on');
  $('#create-pw-field').classList.add('hidden');
  $$('#create-mode button').forEach((x) => x.classList.toggle('on', x.dataset.mode === 'solo'));
  renderMaxChoices();
  $('#overlay-create').hidden = false;
  Sound.play('click');
  setTimeout(() => $('#create-title').select(), 40);
};

const closeCreate = () => ($('#overlay-create').hidden = true);
$('#create-cancel').onclick = $('#create-close').onclick = closeCreate;

$('#create-ok').onclick = () => {
  const title = $('#create-title').value.trim();
  const pw = $('#create-pw').value.trim();
  if (!title) { toast('방 제목을 입력해 주세요', 'bad'); $('#create-title').focus(); return; }
  if (createSecret && !pw) { toast('비밀번호를 입력해 주세요', 'bad'); $('#create-pw').focus(); return; }

  closeCreate();
  G = null; G = newRoom(profile.nick);
  G.title = title;
  G.mode = createMode;
  G.max = createMax;
  G.secret = createSecret;
  G.password = createSecret ? pw : '';
  G.players[0].emoji = profile.emoji;
  if (G.mode === 'team') G.players.forEach((p) => { if (!p.team) assignSeat(p); });
  Sound.play('join');
  renderLobby(); show('lobby'); save();
  toast('방을 만들었습니다');
};

/* 이어서 하기 (0-4) */
$('#btn-resume').onclick = () => {
  const saved = loadSaved();
  if (!saved) { toast('이어서 할 게임이 없습니다', 'bad'); return; }
  G = saved; seq = saved.seq || G.players.length;
  if (G.finished) { renderResult(); show('result'); return; }
  if (G.started) { render(); show('game'); startTimer(); toast('게임에 복귀했습니다'); }
  else { renderLobby(); show('lobby'); }
};

/* ===========================================================
   대기실
   =========================================================== */
/* 앞 팀부터 2명씩 채우되, 두 번째 사람은 다른 팀으로 보낸다.
   그냥 앞부터 채우면 2명짜리 방이 한 팀에 몰려 "2팀 이상" 조건을 못 맞춘다 */
function pickFreeTeam(self) {
  const assigned = G.players.filter((p) => p.team && p !== self);
  const counts = TEAMS.map((t) => assigned.filter((p) => p.team === t.id).length);
  if (assigned.length === 1) {
    const empty = counts.findIndex((n) => n === 0);
    if (empty !== -1) return TEAMS[empty].id;
  }
  const open = counts.findIndex((n) => n < 2);
  return TEAMS[open === -1 ? 0 : open].id;
}

/* 팀의 i번 자리에 앉은 사람 */
const seatOf = (tid, i, except) =>
  G.players.find((p) => p !== except && p.team === tid && p.slot === i);

function assignSeat(p) {
  p.team = pickFreeTeam(p);
  p.slot = [0, 1].find((i) => !seatOf(p.team, i, p)) ?? 0;
}

/* 자리 번호가 없거나 겹치는 사람을 정리한다 (저장된 예전 방 대비) */
function normalizeSeats() {
  for (const p of G.players) {
    if (!p.team) { assignSeat(p); continue; }
    if (typeof p.slot !== 'number' || seatOf(p.team, p.slot, p)) {
      const free = [0, 1].find((i) => !seatOf(p.team, i, p));
      if (free != null) p.slot = free; else assignSeat(p);
    }
  }
}

/* ===========================================================
   대기실 방 — 캐릭터는 가운데 카펫 위 고정 자리에 선다
   (위치를 계속 주고받지 않아도 되도록 이동 기능은 두지 않는다)
   =========================================================== */
let bubEls = new Map();
let clockTimer = null;

/* n명을 카펫 위에 1~2줄로 나눠 세운다 */
function seatSpots(n) {
  const rows = n <= 4 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)];
  const ys = rows.length === 1 ? [82] : [70, 89];
  const out = [];
  rows.forEach((count, r) => {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      out.push({ x: 30 + t * 40, y: ys[r] });
    }
  });
  return out;
}

function renderStage() {
  const spots = seatSpots(G.players.length);
  $('#stage').innerHTML = G.players.map((p, i) => {
    const col = G.mode === 'team' && p.team ? teamOf(p.team).color : colorHex(p.color);
    const { x, y } = spots[i];
    return `<div class="ch ${p.id === G.meId ? 'is-me' : ''} ${p.ready && !p.host ? 'is-ready' : ''}"
      id="ch-${p.id}" style="left:${x}%;top:${y}%;z-index:${Math.round(y * 10)};--delay:${(i % 4) * 0.35}s">
      <span class="ch-bubble"></span>
      <span class="ch-body" style="background:${col}"></span>
      <span class="ch-name">${esc(p.name)}${p.host ? ' 👑' : ''}</span>
      <span class="ch-ready">준비</span>
    </div>`;
  }).join('');

  bubEls = new Map(G.players.map((p) => [p.id, $('#ch-' + p.id).querySelector('.ch-bubble')]));
}

/* 벽시계를 실제 시각에 맞춘다 */
function updateClock() {
  const now = new Date();
  const m = now.getMinutes();
  const h = now.getHours() % 12 + m / 60;
  const hand = (sel, deg) => {
    const el = $(sel);
    if (el) el.style.transform = `translateX(-50%) rotate(${deg}deg)`;
  };
  hand('.clock .hour', h * 30);
  hand('.clock .min', m * 6);
}

function startStage() {
  updateClock();
  if (!clockTimer) clockTimer = setInterval(updateClock, 15000);
}
function stopStage() {
  if (clockTimer) clearInterval(clockTimer);
  clockTimer = null;
}

const iamHost = () => !!me().host;

function renderLobby() {
  const host = iamHost();
  G.players.forEach((p) => { if (p.host) p.ready = true; });   /* 방장의 "시작"이 곧 준비 */
  $('#room-title').textContent = G.title;
  $('#room-lock').textContent = G.secret ? '🔒' : '';
  $$('#mode-seg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === G.mode));
  $('#team-block').hidden = G.mode !== 'team';
  $('#mode-hint').textContent = G.mode === 'solo' ? '개인전 2~6명' : '팀전 2~4팀 · 팀당 1~2명 · 팀원이 번갈아 차례를 맡습니다';
  $('#player-count').textContent = `${G.players.length}/${G.max}명`;

  /* 참여자 목록 (1-4) */
  $('#player-list').innerHTML = G.players.map((p) => {
    const isMe = p.id === G.meId;
    const col = G.mode === 'team' && p.team ? teamOf(p.team).color : colorHex(p.color);
    const teamPick = G.mode === 'team'
      ? `<div class="team-pick">${TEAMS.map((t) => {
          const full = G.players.filter((x) => x.team === t.id && x.id !== p.id).length >= 2;
          return `<button data-team="${p.id}:${t.id}" class="${p.team === t.id ? 'on' : ''}"
                    style="${p.team === t.id ? `background:${t.color};border-color:${t.color}` : ''}"
                    ${full ? 'disabled' : ''}>${t.id}</button>`;
        }).join('')}</div>` : '';
    return `<li class="player-row ${isMe ? 'me' : ''}">
      <span class="p-avatar">${p.emoji}</span>
      <span class="p-id">
        <span class="p-name">${esc(p.name)}</span>
        <i class="p-dot" style="background:${col}" title="말 색상"></i>
      </span>
      ${isMe ? '<span class="p-tag me">나</span>' : ''}
      ${p.host ? '<span class="p-tag host">방장</span>' : ''}
      <span class="p-tag ${p.ready ? 'ready' : ''}" data-toggle-ready="${p.id}" role="button">${p.ready ? '준비완료' : '대기중'}</span>
      ${teamPick}
      ${!isMe && host ? `<button class="btn tiny" data-kick="${p.id}" title="내보내기">✕</button>` : ''}
    </li>`;
  }).join('');

  /* 팀 배정 현황 (1-6) */
  $('#team-grid').innerHTML = TEAMS.map((t) => {
    const mem = G.players.filter((p) => p.team === t.id);
    const slots = [0, 1].map((i) => mem[i]
      ? `<div class="team-slot">${esc(mem[i].name)}</div>`
      : '<div class="team-slot empty">비어 있음</div>').join('');
    return `<div class="team-card" style="border-left-color:${t.color}"><h4 style="color:${t.color}">${t.name}</h4>${slots}</div>`;
  }).join('');

  /* 내 프로필 (1-7) */
  /* 색 고르기 = 팀전에서는 팀 고르기 (한 색에 2명까지) */
  const teamMode = G.mode === 'team';
  if (teamMode) normalizeSeats();
  $('#my-color-dot').style.background = teamMode && me().team ? teamOf(me().team).color : colorHex(me().color);
  $('#btn-room-color').title = teamMode ? '팀 선택' : '내 색상';
  $('#color-title').textContent = teamMode ? '팀 선택' : '내 색상';
  $('#color-hint').textContent = teamMode
    ? '같은 색을 고른 사람끼리 한 팀입니다 · 팀당 2명까지'
    : '다른 참여자가 쓰는 색은 고를 수 없습니다';

  $('#my-colors').innerHTML = teamMode
    ? TEAMS.map((t) => {
        /* 팀마다 자리 2개. 빈 자리를 누르면 그 팀으로 옮긴다 */
        const slots = [0, 1].map((i) => {
          const occ = seatOf(t.id, i);
          const mine = occ && occ.id === G.meId;
          return `<button class="swatch slot ${mine ? 'on' : ''} ${occ ? 'taken' : ''}"
                    style="background:${t.color}" data-team-pick="${t.id}" data-slot="${i}"
                    ${occ && !mine ? 'disabled' : ''}
                    title="${occ ? esc(occ.name) : t.name + ' 빈 자리'}"></button>`;
        }).join('');
        return `<div class="team-col">${slots}</div>`;
      }).join('')
    : COLORS.map((c) => {
        const taken = G.players.some((p) => p.color === c.id && p.id !== G.meId);
        return `<button class="swatch ${me().color === c.id ? 'on' : ''}" style="background:${c.hex}"
                  data-color="${c.id}" ${taken ? 'disabled' : ''} title="${c.name}"></button>`;
      }).join('');

  /* 방장 전용 조작 (1-5, 1-9, 1-11) */
  const chk = startCheck();
  $$('#mode-seg button').forEach((b) => (b.disabled = !host));
  $('#btn-claim-host').classList.toggle('hidden', host);

  $('#stage-actions').innerHTML = host
    ? `<button class="btn primary" data-act="start" data-spec="1-11"
         ${chk.ok ? '' : 'disabled'} title="${esc(chk.msg || '')}">시작</button>`
    : `<button class="btn ghost ${me().ready ? 'on' : ''}" data-act="ready" data-spec="1-8">
         ${me().ready ? '준비 완료' : '준비'}</button>`;
  renderRoster();
  renderStage();
}

/* 방 위에 겹쳐 띄우는 대기자 명단 */
function renderRoster() {
  $('#roster').innerHTML = `
    <div class="roster-head">대기자 <b>${G.players.length}/${G.max}</b></div>
    <ul>${[...G.players].sort((a, b) => (b.host ? 1 : 0) - (a.host ? 1 : 0)).map((p) => {
      const col = G.mode === 'team' && p.team ? teamOf(p.team).color : colorHex(p.color);
      return `<li class="${p.id === G.meId ? 'me' : ''}">
        <span class="roster-avatar" style="background:${col}">${p.emoji}</span>
        <span class="roster-name">${esc(p.name)}</span>
        ${p.host
          ? '<span class="roster-crown">👑</span>'
          : `<span class="roster-ready ${p.ready ? 'on' : ''}">${p.ready ? '✓' : ''}</span>`}
      </li>`;
    }).join('')}</ul>`;
}

/* ---------- 채팅 ---------- */
const GREETINGS = ['안녕하세요~', '반갑습니다', '한 판 해요', '오 사람 있다', '기다리고 있었어요', '드가자'];
const BUBBLE_MS = 4000;
/* 채팅은 방이 살아 있는 동안 전부 남긴다 — 개수를 자르지 않는다 */

function renderChat() {
  const log = $('#chat-log');
  log.innerHTML = (G.chat || []).map((m) => (m.me
    ? `<li class="me"><span class="chat-bubble">${esc(m.text)}</span></li>`
    : `<li>
        <span class="chat-who" style="background:${m.color}">${m.emoji}</span>
        <span class="chat-col">
          <b>${esc(m.name)}</b>
          <span class="chat-bubble">${esc(m.text)}</span>
        </span>
      </li>`)).join('');
  log.scrollTop = log.scrollHeight;
}

/* 말풍선은 보낸 사람 캐릭터 위에 잠깐 떴다가 사라진다 */
const bubbleTimers = new Map();

function showBubble(p, text) {
  const bub = bubEls.get(p.id);
  if (!bub) return;
  bub.textContent = text;
  bub.classList.add('on');
  clearTimeout(bubbleTimers.get(p.id));
  bubbleTimers.set(p.id, setTimeout(() => bub.classList.remove('on'), BUBBLE_MS));
}

function pushChat(p, text) {
  (G.chat ||= []).push({
    name: p.name, emoji: p.emoji, text, me: p.id === G.meId,
    color: G.mode === 'team' && p.team ? teamOf(p.team).color : colorHex(p.color),
  });
  showBubble(p, text);
  renderChat();
}

function sendChat() {
  const input = $('#chat-text');
  const text = input.value.trim();
  if (!text) return;
  pushChat(me(), text);
  input.value = '';
  save();
  Sound.play('click');
}

/* 버튼으로 열고 닫는다. 열면 버튼 자리까지 채팅창이 차지한다 */
function toggleChat(open, silent) {
  $('#chat-panel').hidden = !open;
  $('#btn-chat').classList.toggle('hidden', open);
  if (open) { renderChat(); setTimeout(() => $('#chat-text').focus(), 40); }
  if (!silent) Sound.play('click');
}
$('#btn-chat').onclick = () => toggleChat(true);
$('#btn-chat-close').onclick = () => toggleChat(false);
$('#btn-chat-send').onclick = sendChat;
$('#chat-text').onkeydown = (e) => {
  if (isComposing(e)) return;
  if (e.key === 'Enter') sendChat();
  if (e.key === 'Escape') toggleChat(false);

};

$('#btn-room-color').onclick = () => { $('#overlay-color').hidden = false; Sound.play('click'); };

/* 게임 시작 조건 (1-11) */
function startCheck() {
  const n = G.players.length;
  if (!G.players.every((p) => p.ready)) return { ok: false, msg: '전원이 준비해야 시작할 수 있습니다' };
  if (n > G.max) return { ok: false, msg: `이 방의 정원은 ${G.max}명입니다` };
  if (G.mode === 'solo') {
    if (n < 2) return { ok: false, msg: '개인전은 2명부터 시작할 수 있습니다' };
    if (n > 6) return { ok: false, msg: '개인전 정원은 6명입니다' };
    return { ok: true };
  }
  const used = [...new Set(G.players.map((p) => p.team).filter(Boolean))];
  if (G.players.some((p) => !p.team)) return { ok: false, msg: '모든 참여자가 팀에 속해야 합니다' };
  if (used.length < 2) return { ok: false, msg: '팀전은 2팀부터 시작할 수 있습니다' };
  if (used.length > 4) return { ok: false, msg: '팀은 최대 4팀입니다' };
  /* 2-2-1 처럼 인원이 어긋난 채로는 시작할 수 없다.
     팀당 2명까지, 그리고 모든 팀의 인원이 같아야 한다 (1대1 팀전도 허용) */
  const size = (t) => G.players.filter((p) => p.team === t).length;
  const sizes = used.map(size);
  if (sizes.some((n) => n > 2)) return { ok: false, msg: '팀당 인원은 2명까지입니다' };
  if (new Set(sizes).size > 1) {
    const detail = used.map((t) => `${teamOf(t).name} ${size(t)}명`).join(' · ');
    return { ok: false, msg: `팀마다 인원이 같아야 합니다 (${detail})` };
  }
  return { ok: true };
}

/* 방장 권한 받기 — 프로토타입 전용(다른 기기의 방장 대신) */
$('#btn-claim-host').onclick = () => {
  G.players.forEach((p) => (p.host = p.id === G.meId));
  Sound.play('click'); toast('방장이 되었습니다');
  renderLobby(); save();
};

$('#mode-seg').onclick = (e) => {
  const b = e.target.closest('button'); if (!b || b.disabled) return;
  G.mode = b.dataset.mode;
  if (G.mode === 'team') G.players.forEach((p) => { if (!p.team) assignSeat(p); });
  Sound.play('click'); renderLobby(); save();
};

$('#player-list').onclick = (e) => {
  const t = e.target.closest('[data-team]');
  if (t) {
    const [pid, tid] = t.dataset.team.split(':');
    if (G.players.filter((p) => p.team === tid && p.id !== pid).length >= 2) return;
    player(pid).team = tid; Sound.play('click'); renderLobby(); save(); return;
  }
  const r = e.target.closest('[data-toggle-ready]');
  if (r) { const p = player(r.dataset.toggleReady); p.ready = !p.ready; renderLobby(); save(); return; }
  const k = e.target.closest('[data-kick]');
  if (k) kick(k.dataset.kick);
};

/* 참여자 내보내기 (1-9) */
async function kick(pid) {
  const p = player(pid);
  if (!await confirmBox('참여자 내보내기', `${p.name}님을 방에서 내보낼까요?`, '내보내기')) return;
  G.players = G.players.filter((x) => x.id !== pid);
  toast(`${p.name}님을 내보냈습니다`);
  renderLobby(); save();
}

$('#my-colors').onclick = (e) => {
  const b = e.target.closest('[data-color], [data-team-pick]'); if (!b || b.disabled) return;
  if (b.dataset.teamPick) {
    me().team = b.dataset.teamPick;
    me().slot = Number(b.dataset.slot);
  } else {
    me().color = b.dataset.color;
  }
  $('#overlay-color').hidden = true;
  Sound.play('click'); renderLobby(); save();
};

$('#stage-actions').onclick = (e) => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  if (b.dataset.act === 'ready') {
    me().ready = !me().ready;
    Sound.play('click'); renderLobby(); save();
  } else {
    startGame();
  }
};

/* 참여자 추가 — 프로토타입 전용(서버/다른 기기 대신) */
$('#btn-add-bot').onclick = () => {
  if (G.players.length >= G.max) { toast('정원이 가득 찼습니다', 'bad'); return; }
  const used = new Set(G.players.map((p) => p.name));
  const name = BOT_NAMES.find((n) => !used.has(n)) || '광부' + (G.players.length + 1);
  const p = makePlayer(name);
  if (G.mode === 'team') assignSeat(p);
  G.players.push(p);
  Sound.play('join'); toast(`${name}님이 참여했습니다`);
  renderLobby(); save();
  setTimeout(() => {
    pushChat(p, GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    p.ready = true; renderLobby(); save();
  }, S.ms(700));
};

function buildOrder() {
  if (G.mode === 'solo') return shuffle(G.players.map((p) => p.id));
  const byTeam = {};
  for (const p of G.players) (byTeam[p.team] ||= []).push(p.id);
  const tids = shuffle(Object.keys(byTeam));
  tids.forEach((t) => shuffle(byTeam[t]));
  const order = [];
  const max = Math.max(...tids.map((t) => byTeam[t].length));
  for (let i = 0; i < max; i++) for (const t of tids) if (byTeam[t][i]) order.push(byTeam[t][i]);
  return order;
}

/* 방 나가기 (1-12) */
$('#btn-leave-room').onclick = async () => {
  if (!await confirmBox('방 나가기', '대기실에서 나갈까요?', '나가기')) return;
  clearSaved(); G = null; refreshHome(); show('home');
};

/* 게임 시작 (1-11) */
function startGame() {
  const chk = startCheck();
  if (!chk.ok) { toast(chk.msg, 'bad'); return; }
  if (!G.order.length || G.order.length !== G.players.length) G.order = buildOrder();
  G.started = true; G.finished = false; G.winner = null;
  G.markers = {}; G.claimed = {}; G.runners = {}; G.stats = {}; G.turn = 0;
  Sound.ensure(); Sound.play('turn');
  show('game'); startTurn(); startTimer();
}

/* ===========================================================
   게임 진행
   =========================================================== */
/* 차례가 넘어갈 때 화면 가운데에 크게 알린다 (2-2) */
let turnBannerTimer = null;
function showTurnBanner() {
  const p = currentPlayer();
  const info = sideInfo(currentSide());
  const el = $('#turn-banner');
  $('#turn-banner-team').textContent = G.mode === 'team' ? info.name : '';
  $('#turn-banner-name').textContent = p.name;
  $('#turn-banner-name').style.color = info.color;

  el.hidden = false;
  el.classList.remove('show');
  void el.offsetWidth;                 /* 같은 사람이 연속이어도 애니메이션을 다시 재생 */
  el.classList.add('show');
  clearTimeout(turnBannerTimer);
  turnBannerTimer = setTimeout(() => { el.hidden = true; }, S.ms(1700));
}

function startTurn() {
  G.phase = 'idle'; G.runners = {}; G.options = []; G.rollsThisTurn = 0;
  render(); save();
  showTurnBanner();
  Sound.play('turn');
}

/* 주사위 굴리기 (2-3) */
async function roll() {
  if (G.phase === 'rolling') return;
  G.phase = 'rolling';
  G.dice = [d6(), d6(), d6(), d6()];
  G.rollsThisTurn++;
  Sound.play('roll');
  renderDice(true); renderOptions(); renderActions();
  /* 주사위가 완전히 멈춘 뒤 0.6초 쉬었다가 조합표를 연다 */
  const settle = Dice3D.ok ? Dice3D.settleMs() : S.ms(1650);
  await sleep(settle + S.ms(600));
  if (!G || !G.started) return;
  G.options = computePairings(currentSide());
  if (!G.options.some((p) => p.plays.length)) { bust(); return; }
  G.phase = 'rolled';
  render(); save();
}

/* 조합 선택 + 탐험가 이동 (2-4, 2-5) */
let DIG_MS = 520;                       /* 한 칸 파는 데 걸리는 시간 */

/* 고른 조합만큼 한 칸씩 파고 내려간다 (같은 합이 두 번이면 두 칸) */
async function choose(sums) {
  if (G.phase !== 'rolled') return;
  const side = currentSide();
  G.phase = 'digging'; G.options = [];
  renderOptions(); renderActions(); renderDice(false);

  for (const s of sums) {
    justMoved.clear();
    applyUse(s, G.runners, side);
    justMoved.add(s);
    Sound.play('dig');
    renderBoard();
    await sleep(S.ms(DIG_MS));
    if (!G || !G.started) return;
  }

  justMoved.clear();
  G.phase = 'moved';
  render(); save();
}

/* 붕괴 판정 (2-6) */
async function bust() {
  G.phase = 'bust';
  stats(currentSide()).busts++;
  Sound.play('bust');
  toast('붕괴! 이번 턴 진행이 사라졌습니다', 'bad');
  $('#board').classList.add('shake');
  $('#fx-bust').classList.add('on');
  renderActions();
  await sleep(S.ms(1500));
  $('#fx-bust').classList.remove('on');
  $('#board').classList.remove('shake');
  if (!G || !G.started) return;
  G.runners = {};
  nextTurn();
}

/* 멈추기 = 버팀목 설치 (2-8) + 보물 발견 (2-9) + 승리 판정 (2-10) */
function stopDigging(auto = false) {
  if (!['idle', 'rolled', 'moved'].includes(G.phase)) return;
  const side = currentSide();
  const st = stats(side);
  st.maxStreak = Math.max(st.maxStreak, G.rollsThisTurn);
  G.markers[side] ||= {};

  const gained = [];
  justClaimed.clear();
  for (const key of Object.keys(G.runners)) {
    const col = Number(key);
    G.markers[side][col] = G.runners[col];
    if (G.runners[col] >= DEPTH[col] && G.claimed[col] == null) {
      G.claimed[col] = side;
      gained.push(col);
      justClaimed.add(col);
      for (const other of allSides()) {                       // 다른 플레이어 버팀목 제거 (2-9)
        if (other !== side && G.markers[other]) delete G.markers[other][col];
      }
    }
  }
  G.runners = {}; G.options = []; G.phase = 'wait';

  if (gained.length) { Sound.play('treasure'); toast(`보물 발견! ${gained.join('번, ')}번 갱도 차지`, 'good'); }
  else if (!auto) Sound.play('click');

  render(); save();

  if (claimCount(side) >= WIN_CLAIMS) { finish(side); return; }
  setTimeout(() => { justClaimed.clear(); if (G && G.started && !G.finished) nextTurn(); }, S.ms(gained.length ? 800 : 220));
}

function nextTurn() {
  G.turn = (G.turn + 1) % G.order.length;
  startTurn();
}

function finish(side) {
  G.finished = true; G.started = false; G.winner = side;
  stopTimer();
  Sound.play('win');
  clearSaved();                                               // 저장된 진행 게임 삭제 (3-1)
  renderResult();
  setTimeout(() => show('result'), S.ms(700));
}

/* 게임 나가기 (2-11) */
$('#btn-leave-game').onclick = async () => {
  if (!await confirmBox('게임 나가기', '진행 중인 게임을 중단하고 홈으로 갈까요?', '나가기')) return;
  stopTimer(); clearSaved(); G = null; refreshHome(); show('home');
};

/* 단계별 제한 시간 (5-3)
   굴리기 전 10초 / 조합 고르기 15초. 굴리는 중·파는 중처럼 연출 단계는 세지 않는다 */
let timerPhase = null;

function timerTick() {
  if (!G || !G.started || G.finished) return;
  if (!S.timer) { renderTimer(); return; }
  if (G.phase !== timerPhase) { renderTimer(); return; }
  if (!PHASE_LIMIT[G.phase]) return;

  G.turnLeft--;
  renderTurnBar();                       /* 남은 초 표시만 갱신 (막대는 CSS 가 흘린다) */
  if (G.turnLeft <= 0) onTimeUp();
}

function onTimeUp() {
  if (G.phase === 'rolled') {
    const live = G.options.find((p) => p.plays.length);
    if (live) { toast('시간 초과 — 자동으로 선택합니다', 'bad'); choose(live.plays[0]); return; }
  }
  toast('시간 초과 — 자동으로 멈춥니다', 'bad');
  stopDigging(true);
}

function startTimer() {
  stopTimer();
  timerPhase = null;
  timerId = setInterval(timerTick, 1000);
}
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } timerPhase = null; }

function setBar(bar, width, transition) {
  bar.style.transition = 'none';
  bar.style.width = width;
  void bar.offsetWidth;                  /* 강제 리플로우 — 전환 없이 즉시 적용 */
  if (transition) { bar.style.transition = transition; }
}

function renderTimer() {
  const bar = $('#timer-bar');
  const limit = PHASE_LIMIT[G.phase];
  const changed = G.phase !== timerPhase;
  if (changed) {
    timerPhase = G.phase;
    if (limit) G.turnLeft = limit;
  }

  if (!S.timer) { setBar(bar, '100%'); return; }

  if (!limit) {
    /* 제한 없는 단계 — 흐르던 막대를 그 자리에 멈춘다 */
    if (changed) setBar(bar, getComputedStyle(bar).width);
    return;
  }

  if (!changed) return;                  /* 같은 단계 중에는 건드리지 않는다 */

  /* 가득 채운 뒤 제한 시간 동안 0% 까지 흐르게 한다.
     매초 너비를 바꾸면 CSS 전환이 1초씩 뒤처져 시간이 다 돼도 막대가 남는다 */
  setBar(bar, '100%', `width ${limit}s linear`);
  bar.style.width = '0%';

  /* 타이머 간격을 단계 시작에 맞춰 다시 세운다 */
  if (timerId) { clearInterval(timerId); timerId = setInterval(timerTick, 1000); }
}

/* ===========================================================
   게임 화면 렌더링
   =========================================================== */
function render() {
  renderTurnBar(); renderScore(); renderBoard(); renderDice(false); renderOptions(); renderActions(); renderTimer();
}

/* 누구 차례인지는 헤더의 참여자 목록에서 강조로 보여준다 */
function renderTurnBar() {
  const limit = PHASE_LIMIT[G.phase];
  $('#turn-sub').textContent = S.timer && limit ? `${Math.max(0, G.turnLeft)}초` : '';
}

function renderScore() {
  const curSide = currentSide();
  const curId = G.order[G.turn];
  $('#score-strip').innerHTML = allSides().map((sid) => {
    const info = sideInfo(sid);
    const gems = '💎'.repeat(claimCount(sid)) || '·';
    const head = `<i class="p-chip" style="background:${info.color};width:9px;height:9px"></i>
      <b style="color:var(--text)">${esc(info.name)}</b>`;

    if (G.mode !== 'team') {
      return `<div class="score-chip ${sid === curSide ? 'active' : ''}" style="color:${info.color}">
        ${head}<span class="score-gems">${gems}</span>
      </div>`;
    }

    /* 팀전: 팀은 이름표일 뿐이고, 강조는 지금 차례인 사람 하나에만 건다 */
    const mems = G.order.map(player).filter((p) => p && sideOf(p.id) === sid).map((p) => {
      const on = p.id === curId;
      return `<em class="${on ? 'on' : ''}" style="background:${info.color}${on ? '3d' : '1f'}"
        >${esc(p.name)}</em>`;
    }).join('');
    return `<div class="score-chip team" style="color:${info.color}">
      ${head}<span class="team-mems">${mems}</span>
      <span class="score-gems">${gems}</span>
    </div>`;
  }).join('');
}

function layerOf(d, len) {
  const r = d / len;
  if (r <= 0.34) return 'soil';
  if (r <= 0.62) return 'rock';
  if (r <= 0.85) return 'crystal';
  return 'lava';
}

/* 칸 크기를 보드 영역에 맞춰 계산한다.
   가로: 11개 갱도가 양 끝까지 / 세로: 7번 갱도(13칸)가 바닥까지 */
const BOARD_GAP = 2;
const MAX_DEPTH = Math.max(...Object.values(DEPTH));   /* 13 */

function fitBoard() {
  Dice3D.resize();
  const wrap = $('.board-wrap');
  if (!wrap || !wrap.clientWidth) return;
  const cs = getComputedStyle(wrap);
  const w = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const h = wrap.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);

  /* 가로 11칸, 세로 14칸(머리칸 포함)이라 정사각형으로는 양쪽을 다 채울 수 없다.
     폭과 높이를 따로 계산해 칸을 가로로 넓은 직사각형으로 만든다 */
  const cw = (w - (COLUMNS.length - 1) * BOARD_GAP) / COLUMNS.length;
  const ch = (h - 7 - MAX_DEPTH * BOARD_GAP) / (MAX_DEPTH + 1);

  const cellW = Math.max(14, Math.floor(cw));
  const cellH = Math.max(12, Math.floor(ch));
  const root = document.documentElement.style;
  root.setProperty('--cell-w', cellW + 'px');
  root.setProperty('--cell-h', cellH + 'px');
  root.setProperty('--cell', Math.min(cellW, cellH) + 'px');   /* 말·아이콘 크기 기준 */
}

let boardResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(boardResizeTimer);
  boardResizeTimer = setTimeout(fitBoard, 120);
});

/* 갱도 보드 (2-1) */
function renderBoard() {
  fitBoard();
  const side = currentSide();
  const sides = allSides();
  let html = '';
  for (const col of COLUMNS) {
    const len = DEPTH[col];
    const owner = G.claimed[col];
    let cells = '';
    for (let d = 1; d <= len; d++) {
      let inner = '';
      const dots = sides
        .filter((sid) => ((G.markers[sid] || {})[col] || 0) === d)
        .map((sid) => `<i class="piece" style="background:${sideInfo(sid).color}"></i>`)
        .join('');
      if (dots) inner += `<div class="pieces">${dots}</div>`;
      if (G.runners[col] === d) {
        const c = sideInfo(side).color;
        inner += `<i class="runner ${justMoved.has(col) ? 'just-moved' : ''}" style="background:${c};color:${c}"></i>`;
      }
      cells += `<div class="cell ${layerOf(d, len)}${d === len ? ' bottom' : ''}">${inner}</div>`;
    }
    const oc = owner ? sideInfo(owner).color : '';
    html += `<div class="tunnel ${owner ? 'claimed' : ''} ${G.runners[col] != null ? 'hot' : ''} ${justClaimed.has(col) ? 'just-claimed' : ''}">
      <div class="tunnel-head">${col}</div>${cells}
      ${owner ? `<div class="claim-flag" style="background:${oc};color:${oc}">💎</div>` : ''}
    </div>`;
  }
  $('#board').innerHTML = html;
}


/* ===========================================================
   3D 주사위 (three.js)
   게임 로직이 정한 눈을 그대로 보여줘야 하므로, 구르는 경로는 물리처럼
   연출하되 마지막 자세는 목표 면이 위로 오도록 정확히 맞춘다.
   three.js 를 못 불러오면 아래 CSS 주사위로 자동 대체된다.
   =========================================================== */
const Dice3D = {
  ok: false, rolling: false, dice: [], raf: null, t0: 0, duration: 1900,
  STAGGER: 0.1,                                 /* 주사위마다 duration 의 10%씩 늦게 출발 */

  /* BoxGeometry 면 순서 [+X,-X,+Y,-Y,+Z,-Z] — 마주 보는 면의 합이 7 */
  FACE_ORDER: [1, 6, 2, 5, 3, 4],
  NORMALS: {
    1: [1, 0, 0], 6: [-1, 0, 0],
    2: [0, 1, 0], 5: [0, -1, 0],
    3: [0, 0, 1], 4: [0, 0, -1],
  },

  pipTexture(n) {
    const S = 160, c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#fdf8ee'; g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(32,48,58,.14)'; g.lineWidth = 6;
    g.strokeRect(3, 3, S - 6, S - 6);
    const a = 44, b = 80, d = 116;
    const SPOTS = {
      1: [[b, b]], 2: [[a, a], [d, d]], 3: [[a, a], [b, b], [d, d]],
      4: [[a, a], [d, a], [a, d], [d, d]],
      5: [[a, a], [d, a], [b, b], [a, d], [d, d]],
      6: [[a, a], [d, a], [a, b], [d, b], [a, d], [d, d]],
    };
    g.fillStyle = '#20303a';
    for (const [x, y] of SPOTS[n]) { g.beginPath(); g.arc(x, y, 15, 0, Math.PI * 2); g.fill(); }
    return new THREE.CanvasTexture(c);
  },

  init() {
    if (this.ok || typeof THREE === 'undefined') return;
    const canvas = $('#dice-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.H = 11;                                  /* 화면에 보이는 세로 world 단위 — 키우면 주사위가 작아진다 */
    this.camera = new THREE.OrthographicCamera(-4, 4, 3.5, -3.5, 0.1, 100);
    this.camera.position.set(0, 8, 8);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(4, 10, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
    this.scene.add(key);
    this.scene.add(new THREE.DirectionalLight(0xbfe6ff, 0.25).translateX(-6).translateY(4));

    /* 그림자만 받는 바닥 — 게임판이 비쳐 보이도록 투명하게 */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.26 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const tex = {}; for (let n = 1; n <= 6; n++) tex[n] = this.pipTexture(n);
    const mats = this.FACE_ORDER.map((n) => new THREE.MeshStandardMaterial({
      map: tex[n], roughness: 0.42, metalness: 0.02,
    }));
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(geo, mats);
      m.castShadow = true;
      m.visible = false;
      this.scene.add(m);
      this.dice.push({ mesh: m });
    }
    this.ok = true;
    this.resize();
  },

  resize() {
    if (!this.ok) return;
    const wrap = $('.board-wrap');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const a = w / h, hh = this.H / 2;
    Object.assign(this.camera, { left: -hh * a, right: hh * a, top: hh, bottom: -hh });
    this.camera.updateProjectionMatrix();
    this.halfW = hh * a;
    if (!this.rolling) this.renderer.render(this.scene, this.camera);
  },

  /* 해당 눈이 위(+Y)로 오는 자세 + 무작위 요(yaw) */
  restQuat(value) {
    const n = new THREE.Vector3(...this.NORMALS[value]);
    const q = new THREE.Quaternion().setFromUnitVectors(n, new THREE.Vector3(0, 1, 0));
    const yaw = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
    return q.premultiply(yaw);
  },

  roll(values) {
    if (!this.ok) return false;
    this.resize();
    const spread = Math.min(1.7, this.halfW / 3);
    this.dice.forEach((d, i) => {
      const m = d.mesh;
      m.visible = true;
      d.delay = i * this.STAGGER;
      d.from = new THREE.Vector3(this.halfW + 2.5 + i * 0.8, 3.4 + Math.random(), 3.2);
      d.to = new THREE.Vector3((i - 1.5) * spread + (Math.random() - .5) * .3,
                               0.5, (Math.random() - .5) * .8);
      d.hop = 2.6 + Math.random() * 0.9;
      d.qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(
        Math.random() * 6, Math.random() * 6, Math.random() * 6));
      d.axis = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
      d.spin = 14 + Math.random() * 10;
      d.qRest = this.restQuat(values[i]);
      d.qHold = new THREE.Quaternion();
      m.position.copy(d.from);
      m.quaternion.copy(d.qStart);
    });
    this.rolling = true;
    this.t0 = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick.bind(this));
    return true;
  },

  /* 마지막 주사위까지 완전히 멈추는 데 걸리는 시간 */
  settleMs() {
    const dur = this.duration / (S.speed === 'fast' ? 2 : 1);
    return dur * (1 + (this.dice.length - 1) * this.STAGGER);
  },

  tick(now) {
    const dur = this.duration / (S.speed === 'fast' ? 2 : 1);
    let busy = false;
    for (const d of this.dice) {
      if (!d.mesh.visible) continue;
      const t = Math.max(0, Math.min(1, (now - this.t0) / dur - d.delay));
      if (t < 1) busy = true;

      /* 위치: 가로는 감속하며 도착, 세로는 튕기며 잦아든다 */
      const e = 1 - Math.pow(1 - t, 2.4);
      d.mesh.position.lerpVectors(d.from, d.to, e);
      d.mesh.position.y = d.to.y
        + Math.abs(Math.sin(Math.PI * 2.4 * t)) * d.hop * Math.pow(1 - t, 1.7);

      /* 회전: 빠르게 구르다가 마지막 구간에서 목표 자세로 붙는다 */
      const SETTLE = 0.62;
      if (t < SETTLE) {
        const spun = new THREE.Quaternion().setFromAxisAngle(d.axis, d.spin * t);
        d.mesh.quaternion.copy(d.qStart).multiply(spun);
        d.qHold.copy(d.mesh.quaternion);
      } else {
        const k = (t - SETTLE) / (1 - SETTLE);
        d.mesh.quaternion.copy(d.qHold).slerp(d.qRest, 1 - Math.pow(1 - k, 3));
      }
    }
    this.renderer.render(this.scene, this.camera);
    if (busy) this.raf = requestAnimationFrame(this.tick.bind(this));
    else { this.rolling = false; this.raf = null; }
  },

  clear() {
    if (!this.ok) return;
    this.rolling = false;
    cancelAnimationFrame(this.raf); this.raf = null;
    this.dice.forEach((d) => (d.mesh.visible = false));
    this.renderer.render(this.scene, this.camera);
  },
};

/* 큐브를 돌려 해당 눈이 정면을 보게 하는 각도. 마주 보는 면의 합은 7 */
const FACE_REST = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
const FACES = [1, 2, 3, 4, 5, 6];

const pipsHtml = (f) =>
  PIPS[f].map(([r, c]) => `<i class="pip" style="grid-area:${r}/${c}"></i>`).join('');

/* 주사위는 판 위에 흩어져 놓인다. 굴릴 때는 오른쪽 아래에서 회전하며 날아와 서서히 멈춘다 */
function renderDice(rolling) {
  const layer = $('#dice-fly');
  /* 굴리는 중·조합 고르는 중에만 보인다. 조합을 고르면 치운다 */
  if (G.phase !== 'rolling' && G.phase !== 'rolled') {
    layer.innerHTML = ''; Dice3D.clear(); return;
  }
  if (Dice3D.ok) {                       /* 3D 로 그릴 수 있으면 CSS 주사위는 쓰지 않는다 */
    layer.innerHTML = '';
    if (rolling) Dice3D.roll(G.dice);
    return;
  }

  layer.innerHTML = G.dice.map((f, i) => {
    const x = 30 + i * 13 + (Math.random() * 6 - 3);
    const y = 44 + (Math.random() * 16 - 8);
    const [rx, ry] = FACE_REST[f];
    /* 기울기는 Z축(시선축)에 준다. X·Y 를 건드리면 결과 면이 정면에서 틀어진다 */
    const rz = Math.round(Math.random() * 44 - 22);
    const spin = (turns) => 360 * (turns + Math.floor(Math.random() * 2));
    const faces = FACES.map((n) => `<i class="face f${n}">${pipsHtml(n)}</i>`).join('');
    return `<div class="die-slot" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%">
      <div class="die3d ${rolling ? 'throw' : ''}"
        style="--rx:${rx}deg;--ry:${ry}deg;--rz:${rz}deg;
               --spx:${spin(2)}deg;--spy:${spin(3)}deg;--spz:${spin(1)}deg;
               --fx:${(34 + Math.random() * 12).toFixed(0)}vw;--fy:${(22 + Math.random() * 10).toFixed(0)}vh;
               --delay:${i * 95}ms">
        ${faces}
      </div>
    </div>`;
  }).join('');
}

/* 조합 버튼 (2-4) — 3가지 묶음 x 2개 = 항상 6칸을 모두 보여준다 */
const miniDie = (f) =>
  `<span class="mini-die">${PIPS[f].map(([r, c]) => `<i style="grid-area:${r}/${c}"></i>`).join('')}</span>`;

function renderOptions() {
  const el = $('#options');
  if (G.phase !== 'rolled') { el.innerHTML = ''; return; }

  el.innerHTML = G.options.map((p, i) => {
    const dead = p.plays.length === 0;
    /* 둘 중 하나만 쓸 수 있고 어느 쪽이든 고를 수 있을 때만 반쪽이 각각 선택지가 된다 */
    const split = p.plays.length > 1;

    const half = (sum, side) => {
      const play = p.plays.find((pl) => pl.includes(sum));
      const [f1, f2] = p.faces[side];
      const tag = split && play ? 'button' : 'span';
      const attr = split && play ? ` data-play="${i}:${play.join('-')}"` : '';
      return `<${tag} class="combo ${play ? '' : 'off'}"${attr}>${miniDie(f1)}${miniDie(f2)}<b>${sum}</b></${tag}>`;
    };

    const whole = !dead && !split ? ` data-play="${i}:${p.plays[0].join('-')}" role="button" tabindex="0"` : '';
    return `<div class="pairing ${dead ? 'dead' : ''} ${split ? 'split' : ''}"${whole}>
      ${half(p.a, 0)}<i class="combo-plus">+</i>${half(p.b, 1)}
    </div>`;
  }).join('');
}
$('#options').onclick = (e) => {
  const b = e.target.closest('[data-play]'); if (!b) return;
  choose(b.dataset.play.split(':')[1].split('-').map(Number));
};

function renderActions() {
  $('#btn-roll').hidden = !(G.phase === 'idle' || G.phase === 'moved');
  $('#btn-stop').hidden = G.phase !== 'moved';
  $('#roll-label').textContent = G.phase === 'moved' ? '한번 더 굴리기' : '굴리기';
}

$('#btn-roll').onclick = () => roll();
$('#btn-stop').onclick = () => stopDigging();

/* ===========================================================
   결과 (3-1, 3-2)
   =========================================================== */
function renderResult() {
  const w = sideInfo(G.winner);
  $('#winner-name').textContent = w.name;
  $('#winner-name').style.color = w.color;
  $('#winner-sub').textContent = G.mode === 'team'
    ? G.players.filter((p) => 'T' + p.team === G.winner).map((p) => p.name).join(' · ')
    : '가장 깊은 곳의 보물을 모두 차지했다';

  const rows = allSides()
    .map((sid) => ({ sid, info: sideInfo(sid), claims: claimCount(sid), ...stats(sid) }))
    .sort((a, b) => b.claims - a.claims || b.maxStreak - a.maxStreak);

  $('#stat-table').innerHTML =
    `<div class="stat-head"><span>플레이어</span><span>보물</span><span>붕괴</span><span>최장</span></div>` +
    rows.map((r) => `<div class="stat-row ${r.sid === G.winner ? 'win' : ''}">
      <span class="stat-name"><i style="background:${r.info.color}"></i>${esc(r.info.name)}</span>
      <span>${r.claims}</span><span>${r.busts}</span><span>${r.maxStreak}</span>
    </div>`).join('');
}

/* 다시 하기 (3-3) */
$('#btn-again').onclick = () => {
  G.started = false; G.finished = false; G.winner = null;
  G.markers = {}; G.claimed = {}; G.runners = {}; G.stats = {}; G.turn = 0; G.options = [];
  G.players.forEach((p) => (p.ready = false));
  stopTimer();
  renderLobby(); show('lobby'); save();
  toast('같은 멤버로 대기실로 돌아왔습니다');
};
/* 홈으로 (3-4) */
$('#btn-home').onclick = () => { stopTimer(); clearSaved(); G = null; refreshHome(); show('home'); };

/* ===========================================================
   오버레이 / 설정
   =========================================================== */
$$('[data-open-rules]').forEach((b) => (b.onclick = openRules));
$$('[data-open-settings]').forEach((b) => (b.onclick = () => ($('#overlay-settings').hidden = false)));
$$('[data-close-overlay]').forEach((b) => (b.onclick = () => b.closest('.overlay').setAttribute('hidden', '')));
/* 바깥을 눌러 닫기 — 결과를 기다리는 모달(#dialog, #overlay-nick)은 제외한다 */
$$('.overlay').forEach((o) => (o.onclick = (e) => {
  if (e.target === o && o.id !== 'dialog' && o.id !== 'overlay-nick') o.hidden = true;
}));

$('#set-sound').onclick = () => { S.sound = !S.sound; S.save(); if (S.sound) { Sound.ensure(); Sound.play('click'); } };
$('#set-timer').onclick = () => { S.timer = !S.timer; S.save(); timerPhase = null; if (G && G.started) renderTimer(); };
$('#set-spec').onclick  = () => { S.spec = !S.spec; S.save(); };
$('#set-speed').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; S.speed = b.dataset.speed; S.save(); };

/* ===========================================================
   부팅
   =========================================================== */
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function refreshHome() {
  const saved = loadSaved();
  $('#btn-resume').classList.toggle('hidden', !saved);
  if (saved) $('#btn-resume').textContent = saved.started ? '이어서 하기 (진행 중인 게임)' : '이어서 하기 (대기실)';
  renderRooms();
  renderOnline();
  renderPlayground();
}

S.load();
Dice3D.init();
renderProfile();
renderRules();
seedRooms();
seedOnline();
refreshHome();
document.addEventListener('pointerdown', () => Sound.ensure(), { once: true });

/* ===========================================================
   놀이터 — 캐릭터를 움직이며 이야기하는 공간
   OMT 와 섞이지 않도록 상태·DOM·CSS 를 모두 따로 둔다.
   (G 를 쓰지 않으므로 방·게임 상태에 영향이 없다)
   =========================================================== */
const PZ_BOUND = { x0: 6, x1: 94, y0: 56, y1: 94 };   /* 걸어 다닐 수 있는 범위(%) */
const PZ_SPEED = 19;                                  /* 초당 % 이동 */
const PZ_BUBBLE_MS = 4200;
const PZ_CHAT_KEEP = 60;
const PZ_TALK = [
  '안녕하세요~', '여기 누구 있어요?', '한번더 하실 분?', '오늘 날씨 좋네요',
  '분수 예쁘다', '저 벤치에 앉을래요', '반가워요!', '잠깐 쉬는 중',
  '같이 게임해요', '두 명만 더 모이면 될 듯', '좀 있다 올게요', '하이하이',
];

/* 다가가서 Space 를 누를 수 있는 지점들.
   x/y 는 마크업의 --x/--y 와 같아야 하고, rx/ry 는 "가까이 왔다"고 볼 반경(%).
   세로로 걷는 범위가 가로보다 좁아 두 축을 따로 둔다.
   cy 는 안내 문구가 뜰 높이, ride 는 올라탔을 때 캐릭터가 설 자리 */
const PZ_SPOTS = [
  { id: 'dj',     kind: 'dj',   label: '곡 선택', x: 82, y: 49, rx: 14, ry: 10, cy: 36 },
  { id: 'swing',  kind: 'ride', label: '타기',    x: 16, y: 66, rx: 11, ry: 8,  cy: 52,
    anim: 'ride-swing',  needs: 1, seats: [{ x: 14, y: 60 }, { x: 19, y: 61 }] },
  /* 시소는 혼자서는 안 움직인다. 양쪽에 한 명씩 앉아야 한다 */
  { id: 'seesaw', kind: 'ride', label: '타기',    x: 64, y: 74, rx: 11, ry: 8,  cy: 66,
    anim: 'ride-seesaw', needs: 2, seats: [{ x: 58.5, y: 70 }, { x: 69.5, y: 70 }] },
  { id: 'merry',  kind: 'ride', label: '타기',    x: 9,  y: 88, rx: 10, ry: 7,  cy: 78,
    anim: 'ride-merry',  needs: 1, seats: [{ x: 9, y: 84 }] },
];
const PZ_DJ = PZ_SPOTS[0];                 /* 자주 쓰는 지점은 이름을 따로 둔다 */

/* 숫자키로 내는 표정 */
const PZ_EMOTES = { 1: '👋', 2: '❓', 3: '😄', 4: '🎉' };
const PZ_EMOTE_MS = 2200;
const PZ_TRACKS = [
  { id: 'energetic', title: '신나는 하루', mood: 'Energetic', sec: 132, src: 'audio/01_energetic_inst.mp3' },
  { id: 'calm',      title: '잔잔한 오후', mood: 'Calm',      sec: 132, src: 'audio/02_calm_inst.mp3' },
  { id: 'tension',   title: '두근두근',    mood: 'Tension',   sec: 132, src: 'audio/03_tension_inst.mp3' },
  { id: 'cute',      title: '깡총깡총',    mood: 'Cute',      sec: 132, src: 'audio/04_cute_inst.mp3' },
  { id: 'mystic',    title: '신비한 숲',   mood: 'Mystic',    sec: 132, src: 'audio/05_mystic_inst.mp3' },
  { id: 'epic',      title: '웅장한 광장', mood: 'Epic',      sec: 132, src: 'audio/06_epic_inst.mp3' },
];

const PZ = {
  on: false, raf: null, last: 0, botTimer: null, emoteTimer: null,
  me: null, people: [], els: new Map(), keys: new Set(), chat: [],
  track: null, near: null, lastSec: -1,
  spot: null, riding: null, tod: null, clock: null,
  seats: {}, seesawTimer: null,
};

const pzRand = (a, b) => a + Math.random() * (b - a);
const pzClamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function pzMakePerson(name, emoji, color, me = false) {
  return {
    id: 'pz' + Math.random().toString(36).slice(2, 8),
    name, emoji, color, me,
    x: pzRand(PZ_BOUND.x0 + 6, PZ_BOUND.x1 - 6),
    y: pzRand(PZ_BOUND.y0 + 4, PZ_BOUND.y1 - 2),
    tx: null, ty: null, wait: 0, walking: false, lean: 0,
  };
}

/* 접속해 있는 사람들 — 서버가 없으므로 모의 데이터 */
function pzSeed() {
  const pool = shuffle([...BOT_NAMES]).slice(0, 5 + Math.floor(Math.random() * 3));
  const cols = shuffle([...COLORS]);
  PZ.me = pzMakePerson(profile.nick, profile.emoji, colorHex(cols[0].id), true);
  PZ.people = [PZ.me, ...pool.map((n, i) =>
    pzMakePerson(n, AVATARS[Math.floor(Math.random() * AVATARS.length)],
                 colorHex(cols[(i + 1) % cols.length].id)))];
  PZ.chat = [];
}

function pzBuild() {
  const field = $('#plaza-field');
  /* 놀이기구는 HTML 에 있으므로 지우지 않고, 캐릭터만 갈아 끼운다 */
  field.querySelectorAll('.pz-ch').forEach((el) => el.remove());

  const chHtml = PZ.people.map((p, i) => `
    <div class="pz-ch ${p.me ? 'is-me' : ''}" id="${p.id}" style="--delay:${(i % 4) * 0.35}s">
      <span class="pz-bubble"></span>
      <span class="pz-emote"></span>
      <span class="pz-shadow"></span>
      <span class="pz-body" style="background:${p.color}"></span>
      <span class="pz-name">${esc(p.name)}</span>
    </div>`).join('');

  field.insertAdjacentHTML('beforeend', chHtml);

  PZ.els = new Map(PZ.people.map((p) => {
    const el = $('#' + p.id);
    return [p.id, {
      root: el,
      bubble: el.querySelector('.pz-bubble'),
      emote: el.querySelector('.pz-emote'),
      name: el.querySelector('.pz-name'),
    }];
  }));
  PZ.people.forEach(pzApply);
  $('#plaza-count').textContent = `${PZ.people.length}명`;
}

function pzApply(p) {
  const el = PZ.els.get(p.id); if (!el) return;
  const s = el.root.style;
  s.setProperty('--x', p.x.toFixed(2) + '%');
  s.setProperty('--y', p.y.toFixed(2) + '%');
  s.setProperty('--lean', p.lean.toFixed(1) + 'deg');
  s.zIndex = Math.round(p.y * 10);
  el.root.classList.toggle('walk', p.walking);
}

/* 봇은 목표 지점을 정하고 천천히 걸어간 뒤 잠시 쉰다 */
function pzWander(p, dt) {
  if (p.riding) { p.walking = false; return; }
  if (p.goal) {                                  /* 기구에 앉으러 가는 중 */
    const s = pzSpot(p.goal);
    const i = s ? pzFreeSeat(s) : -1;
    if (i === -1) { p.goal = null; }
    else {
      const dx = s.x - p.x, dy = s.y - p.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { p.goal = null; pzSit(p, s, i); return; }
      const step = Math.min(d, PZ_SPEED * 0.55 * dt);
      p.x += (dx / d) * step; p.y += (dy / d) * step * 0.6;
      p.lean = dx > 0 ? 5 : -5; p.walking = true;
      return;
    }
  }
  if (p.wait > 0) { p.wait -= dt; p.walking = false; return; }
  if (p.tx == null) {
    p.tx = pzRand(PZ_BOUND.x0, PZ_BOUND.x1);
    p.ty = pzRand(PZ_BOUND.y0, PZ_BOUND.y1);
  }
  const dx = p.tx - p.x, dy = p.ty - p.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) { p.tx = null; p.wait = pzRand(1.2, 4.5); p.walking = false; return; }
  const step = Math.min(d, PZ_SPEED * 0.55 * dt);
  p.x += (dx / d) * step;
  p.y += (dy / d) * step * 0.6;          /* 세로는 원근 때문에 덜 움직인다 */
  p.lean = dx > 0 ? 5 : -5;
  p.walking = true;
}

function pzMoveMe(dt) {
  if (PZ.riding) { PZ.me.walking = false; return; }   /* 기구 위에서는 움직이지 않는다 */
  const k = PZ.keys;
  let dx = (k.has('right') ? 1 : 0) - (k.has('left') ? 1 : 0);
  let dy = (k.has('down') ? 1 : 0) - (k.has('up') ? 1 : 0);
  const me = PZ.me;
  if (!dx && !dy) { me.walking = false; me.lean = 0; return; }
  const n = Math.hypot(dx, dy) || 1;
  me.x = pzClamp(me.x + (dx / n) * PZ_SPEED * dt, PZ_BOUND.x0, PZ_BOUND.x1);
  me.y = pzClamp(me.y + (dy / n) * PZ_SPEED * 0.6 * dt, PZ_BOUND.y0, PZ_BOUND.y1);
  me.lean = dx ? (dx > 0 ? 6 : -6) : 0;
  me.walking = true;
}

function pzTick(now) {
  if (!PZ.on) return;
  const dt = Math.min(0.05, (now - PZ.last) / 1000 || 0);
  PZ.last = now;
  pzMoveMe(dt);
  for (const p of PZ.people) if (!p.me) pzWander(p, dt);
  for (const p of PZ.people) pzApply(p);
  pzUpdateCue();
  pzRenderPlayer();
  pzUpdateTod();
  pzUpdateClock();
  PZ.raf = requestAnimationFrame(pzTick);
}

/* ---------- DJ 부스 ---------- */
const pzDist = (s) => Math.hypot((PZ.me.x - s.x) / s.rx, (PZ.me.y - s.y) / s.ry);

/* 반경 안에 든 지점 중 가장 가까운 하나 */
function pzNearSpot() {
  if (!PZ.me) return null;
  let best = null, bestD = Infinity;
  for (const s of PZ_SPOTS) {
    const d = pzDist(s);
    if (d <= 1 && d < bestD) { best = s; bestD = d; }
  }
  return best;
}
function pzNearDJ() { const s = pzNearSpot(); return !!s && s.kind === 'dj'; }

/* 매 프레임 돌지만 상태가 바뀔 때만 DOM 을 건드린다 */
function pzUpdateCue() {
  const spot = PZ.riding ? pzSpot(PZ.riding) : pzNearSpot();
  const id = spot ? spot.id : null;
  if (id === PZ.near) return;
  PZ.near = id;

  const cue = $('#plaza-cue');
  cue.hidden = !spot;
  if (!spot) return;
  cue.style.setProperty('--x', spot.x + '%');
  cue.style.setProperty('--y', spot.cy + '%');
  $('#plaza-cue-label').textContent = PZ.riding ? '내리기' : spot.label;
}

const pzSpot = (id) => PZ_SPOTS.find((s) => s.id === id) || null;

/* ---------- 기구 타기 ---------- */
const pzTaken = (spot) => (PZ.seats[spot.id] ||= spot.seats.map(() => null));
const pzRiderCount = (spot) => pzTaken(spot).filter(Boolean).length;
const pzFreeSeat = (spot) => pzTaken(spot).findIndex((v) => !v);

/* 기구가 움직일지는 "몇 명이 탔는가" 로 정한다.
   시소는 needs 가 2 라 혼자 앉으면 그쪽으로 기운 채 멈춰 있다 */
function pzUpdateRig(spot) {
  const prop = $('#prop-' + spot.id);
  if (!prop) return;
  const taken = pzTaken(spot);
  const n = taken.filter(Boolean).length;
  const active = n >= spot.needs;
  prop.classList.toggle('riding', active);
  prop.classList.toggle('solo-0', !active && !!taken[0]);
  prop.classList.toggle('solo-1', !active && !!taken[1]);

  for (const [i, id] of taken.entries()) {
    if (!id) continue;
    const el = PZ.els.get(id);
    if (el) el.root.classList.toggle('solo', !active);
  }
}

function pzSit(person, spot, i) {
  pzTaken(spot)[i] = person.id;
  person.riding = spot.id; person.seat = i;
  person.x = spot.seats[i].x; person.y = spot.seats[i].y;
  person.walking = false; person.lean = 0;
  const el = PZ.els.get(person.id);
  if (el) el.root.classList.add('ride', spot.anim, 'seat-' + i);
  pzUpdateRig(spot);
}

function pzStand(person) {
  const spot = pzSpot(person.riding);
  if (!spot) return;
  const taken = pzTaken(spot);
  const i = taken.indexOf(person.id);
  if (i !== -1) taken[i] = null;
  person.riding = null; person.seat = null;
  const el = PZ.els.get(person.id);
  if (el) el.root.classList.remove('ride', 'ride-swing', 'ride-seesaw', 'ride-merry',
                                   'seat-0', 'seat-1', 'solo');
  person.x = spot.x; person.y = spot.y + 2;      /* 기구 앞에 내려선다 */
  pzUpdateRig(spot);
}

function pzRide(spot) {
  const i = pzFreeSeat(spot);
  if (i === -1) { toast('자리가 없습니다', 'bad'); return; }
  PZ.keys.clear();
  pzSit(PZ.me, spot, i);
  PZ.riding = spot.id;
  PZ.near = null;                          /* 안내 문구를 "내리기" 로 다시 그린다 */
  Sound.play('join');
}

function pzDismount() {
  pzStand(PZ.me);
  PZ.riding = null;
  PZ.near = null;
  Sound.play('click');
}

/* 혼자 앉아 있으면 다른 사람이 반대편으로 와서 앉는다 */
function pzSeesawTick() {
  const spot = pzSpot('seesaw');
  const free = pzFreeSeat(spot);
  const n = pzRiderCount(spot);
  if (n >= 1 && free !== -1) {
    const cand = PZ.people.filter((p) => !p.me && !p.riding && !p.goal);
    if (cand.length) cand[Math.floor(Math.random() * cand.length)].goal = 'seesaw';
  } else if (n === 2) {
    /* 둘 다 앉아 있으면 가끔 봇이 일어난다 */
    const bot = PZ.people.find((p) => !p.me && p.riding === 'seesaw');
    if (bot && Math.random() < 0.25) pzStand(bot);
  }
  PZ.seesawTimer = setTimeout(pzSeesawTick, pzRand(2500, 5000));
}

/* ---------- 이모트 ---------- */
const pzEmoteTimers = new Map();

function pzEmote(p, mark) {
  const el = PZ.els.get(p.id);
  if (!el || !el.emote) return;
  el.emote.textContent = mark;
  el.emote.classList.add('on');
  clearTimeout(pzEmoteTimers.get(p.id));
  pzEmoteTimers.set(p.id, setTimeout(() => el.emote.classList.remove('on'), PZ_EMOTE_MS));
}

/* ---------- 낮 / 밤 ---------- */
function pzTimeOfDay(h) {
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 17) return 'day';
  if (h >= 17 && h < 19) return 'dusk';
  return 'night';
}

/* 12시간제 AM/PM. 0시는 12 AM, 12시는 12 PM 이다 */
function pzClockText(d) {
  const h24 = d.getHours();
  const h = h24 % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}
const PZ_TOD_ICON = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };

function pzUpdateClock(now = new Date()) {
  const text = pzClockText(now);
  if (text === PZ.clock) return;          /* 분이 바뀔 때만 DOM 을 건드린다 */
  PZ.clock = text;
  $('#pz-clock-time').textContent = text;
  $('#pz-clock-icon').textContent = PZ_TOD_ICON[pzTimeOfDay(now.getHours())];
}

function pzUpdateTod(now = new Date()) {
  const tod = pzTimeOfDay(now.getHours());
  if (tod === PZ.tod) return;
  PZ.tod = tod;
  $('#screen-plaza').dataset.tod = tod;
}

function pzRenderTracks() {
  $('#dj-list').innerHTML = PZ_TRACKS.map((tr) => `
    <button class="dj-track ${PZ.track && PZ.track.id === tr.id ? 'on' : ''}" data-track="${tr.id}">
      <b>${esc(tr.title)}</b><span>${esc(tr.mood)}</span>
    </button>`).join('');
  $('#dj-now').textContent = PZ.track ? `지금 나오는 곡 — ${PZ.track.title}` : '지금 나오는 곡 — 없음';
}

/* 재생 위치는 "시작 시각"에서 계산한다. 남은 초를 따로 들고 있으면
   탭이 멈췄다 돌아왔을 때 어긋난다. 서버가 붙으면 startedAt 이 서버 시각이 된다 */
const pzNow = () => performance.now();

/* ---------- 음원 재생 ----------
   상태(어떤 곡을 언제 시작했는지)가 먼저이고 오디오는 그 상태를 따라간다.
   서버가 붙으면 startedAt 만 서버 시각으로 바뀌고 나머지는 그대로다 */
let pzAudio = null;
const PZ_VOL_KEY = SAVE_KEY + '.pzvol';
let pzVol = 70;                            /* 0~100 */
try {
  const raw = localStorage.getItem(PZ_VOL_KEY);   /* 없으면 null — Number(null) 은 0 이라 먼저 거른다 */
  const v = raw === null ? NaN : Number(raw);
  if (Number.isFinite(v) && v >= 0 && v <= 100) pzVol = v;
} catch {}

function pzSound() {
  if (pzAudio || typeof Audio === 'undefined') return pzAudio;
  pzAudio = new Audio();
  pzAudio.preload = 'none';
  pzAudio.loop = false;
  return pzAudio;
}

/* 곡을 지금 위치부터 재생한다. 브라우저는 클릭 같은 사용자 동작 없이는
   소리를 내주지 않는데, 곡 선택 자체가 클릭이라 그 흐름에서는 허용된다 */
function pzAudioPlay(track, at = 0) {
  const a = pzSound();
  if (!a || !track.src) return;
  const url = new URL(track.src, location.href).href;
  if (a.src !== url) { a.src = track.src; a.load(); }
  a.volume = pzVol / 100;
  try { a.currentTime = at; } catch {}
  a.play().catch(() => toast('브라우저가 자동재생을 막았습니다', 'bad'));
}

function pzAudioStop() {
  const a = pzSound();
  if (!a) return;
  a.pause();
  try { a.currentTime = 0; } catch {}
}

const pzVolIcon = (v) => (v === 0 ? '🔇' : v < 40 ? '🔈' : v < 75 ? '🔉' : '🔊');

function pzRenderVol() {
  const r = $('#pz-vol-range');
  if (r) {
    r.value = String(pzVol);
    r.style.setProperty('--fill', pzVol + '%');
  }
  const i = $('#pz-vol-icon');
  if (i) i.textContent = pzVolIcon(pzVol);
  const a = pzSound();
  if (a) a.volume = pzVol / 100;
}

function pzSetVol(v) {
  pzVol = Math.max(0, Math.min(100, Math.round(Number(v) || 0)));
  try { localStorage.setItem(PZ_VOL_KEY, String(pzVol)); } catch {}
  pzRenderVol();
}
const pzTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function pzAdvance() {
  const i = PZ_TRACKS.findIndex((x) => x.id === PZ.track.id);
  const next = PZ_TRACKS[(i + 1) % PZ_TRACKS.length];
  PZ.track = { ...next, startedAt: pzNow() };
  PZ.lastSec = -1;
  pzAudioPlay(next, 0);
  pzRenderNow(); pzRenderTracks();
}

function pzRenderPlayer() {
  const box = $('#pz-player');
  if (!PZ.track) { box.hidden = true; PZ.lastSec = -1; return; }
  box.hidden = false;

  const elapsed = Math.max(0, (pzNow() - PZ.track.startedAt) / 1000);
  if (elapsed >= PZ.track.sec) { pzAdvance(); return; }   /* 곡이 끝나면 다음 곡으로 */

  const sec = Math.floor(elapsed);
  if (sec === PZ.lastSec) return;                        /* 1초에 한 번만 DOM 을 건드린다 */
  PZ.lastSec = sec;

  $('#pz-title').textContent = PZ.track.title;
  $('#pz-mood').textContent = PZ.track.mood;
  $('#pz-elapsed').textContent = pzTime(sec);
  $('#pz-total').textContent = pzTime(PZ.track.sec);
  $('#pz-bar').style.width = ((sec / PZ.track.sec) * 100).toFixed(2) + '%';

  /* 오디오가 계산 위치에서 많이 벗어나면 맞춘다 (탭 정지·버퍼링 등) */
  const a = pzSound();
  if (a && !a.paused && Math.abs(a.currentTime - elapsed) > 1.5) {
    try { a.currentTime = elapsed; } catch {}
  }
}

function pzRenderNow() {
  $('#plaza-now').hidden = !PZ.track;
  if (PZ.track) $('#plaza-now-title').textContent = PZ.track.title;
}

function pzOpenDJ() {
  PZ.keys.clear();                       /* 모달을 여는 순간 이동을 멈춘다 */
  pzRenderTracks();
  $('#overlay-dj').hidden = false;
  Sound.play('click');
}
function pzCloseDJ() { $('#overlay-dj').hidden = true; }

function pzPickTrack(id) {
  const tr = PZ_TRACKS.find((x) => x.id === id);
  if (!tr) return;
  PZ.track = { ...tr, startedAt: pzNow() };
  PZ.lastSec = -1;
  pzAudioPlay(tr, 0);
  pzRenderNow(); pzRenderTracks(); pzRenderPlayer(); pzCloseDJ();
  Sound.play('join');
  toast(`${tr.title} — 틀었습니다`);
}

function pzStopTrack() {
  PZ.track = null;
  pzAudioStop();
  pzRenderNow(); pzRenderTracks(); pzRenderPlayer(); pzCloseDJ();
  Sound.play('click');
  toast('음악을 껐습니다');
}

$('#dj-list').onclick = (e) => {
  const b = e.target.closest('[data-track]');
  if (b) pzPickTrack(b.dataset.track);
};
$('#btn-dj-off').onclick = pzStopTrack;
if ($('#pz-vol-range')) {
  $('#pz-vol-range').oninput = (e) => pzSetVol(e.target.value);
  pzRenderVol();
}

/* ---------- 말풍선 · 채팅 ---------- */
const pzBubbleTimers = new Map();

function pzBubble(p, text) {
  const el = PZ.els.get(p.id); if (!el) return;
  el.bubble.textContent = text;
  el.bubble.classList.add('on');
  clearTimeout(pzBubbleTimers.get(p.id));
  pzBubbleTimers.set(p.id, setTimeout(() => el.bubble.classList.remove('on'), PZ_BUBBLE_MS));
}

function pzRenderChat() {
  const log = $('#plaza-chat-log');
  log.innerHTML = PZ.chat.map((m) => (m.me
    ? `<li class="me"><span class="chat-bubble">${esc(m.text)}</span></li>`
    : `<li>
        <span class="chat-who" style="background:${m.color}">${m.emoji}</span>
        <span class="chat-col"><b>${esc(m.name)}</b>
          <span class="chat-bubble">${esc(m.text)}</span></span>
      </li>`)).join('');
  log.scrollTop = log.scrollHeight;
}

function pzPush(p, text) {
  PZ.chat.push({ name: p.name, emoji: p.emoji, color: p.color, text, me: !!p.me });
  if (PZ.chat.length > PZ_CHAT_KEEP) PZ.chat = PZ.chat.slice(-PZ_CHAT_KEEP);
  pzBubble(p, text);
  pzRenderChat();
}

function pzSend() {
  const input = $('#plaza-chat-text');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  pzPush(PZ.me, text);
  Sound.play('click');
}

/* 봇이 가끔 말을 건다 */
function pzBotTalk() {
  const others = PZ.people.filter((p) => !p.me);
  if (others.length) {
    const p = others[Math.floor(Math.random() * others.length)];
    pzPush(p, PZ_TALK[Math.floor(Math.random() * PZ_TALK.length)]);
  }
  PZ.botTimer = setTimeout(pzBotTalk, pzRand(7000, 16000));
}

/* 다른 사람들도 가끔 표정을 낸다 */
function pzBotEmote() {
  const others = PZ.people.filter((p) => !p.me);
  if (others.length) {
    const p = others[Math.floor(Math.random() * others.length)];
    const marks = Object.values(PZ_EMOTES);
    pzEmote(p, marks[Math.floor(Math.random() * marks.length)]);
  }
  PZ.emoteTimer = setTimeout(pzBotEmote, pzRand(5000, 12000));
}

/* ---------- 시작 / 종료 ---------- */
function startPlaza() {
  if (PZ.on) return;
  if (!PZ.me) pzSeed();
  PZ.me.name = profile.nick;               /* 프로필이 바뀌었을 수 있다 */
  PZ.on = true; PZ.last = performance.now(); PZ.keys.clear();
  PZ.near = null;                        /* 첫 프레임에서 반드시 한 번 판정하도록 */
  PZ.riding = null; PZ.tod = null; PZ.clock = null; PZ.seats = {};
  PZ.people.forEach((p) => { p.riding = null; p.seat = null; p.goal = null; });
  pzUpdateTod(); pzUpdateClock();
  PZ.lastSec = -1;
  pzBuild(); pzRenderChat(); pzRenderNow(); pzRenderPlayer();
  PZ.raf = requestAnimationFrame(pzTick);
  clearTimeout(PZ.botTimer); clearTimeout(PZ.emoteTimer);
  PZ.botTimer = setTimeout(pzBotTalk, pzRand(3000, 6000));
  PZ.emoteTimer = setTimeout(pzBotEmote, pzRand(2500, 5000));
  clearTimeout(PZ.seesawTimer);
  PZ.seesawTimer = setTimeout(pzSeesawTick, pzRand(2000, 4000));
}

function stopPlaza() {
  if (!PZ.on) return;
  PZ.on = false;
  if (PZ.raf) cancelAnimationFrame(PZ.raf);
  PZ.raf = null;
  clearTimeout(PZ.botTimer); PZ.botTimer = null;
  clearTimeout(PZ.emoteTimer); PZ.emoteTimer = null;
  clearTimeout(PZ.seesawTimer); PZ.seesawTimer = null;
  pzAudioStop();
  pzBubbleTimers.forEach((t) => clearTimeout(t)); pzBubbleTimers.clear();
  pzEmoteTimers.forEach((t) => clearTimeout(t)); pzEmoteTimers.clear();
  PZ.keys.clear();
  pzCloseDJ();
  PZ.riding = null;
  PZ.near = null; $('#plaza-cue').hidden = true;
}

/* 프로필(이름·아바타)이 바뀌면 놀이터에 서 있는 내 캐릭터에도 반영한다.
   놀이터에 들어와 있지 않으면 아무 일도 하지 않는다 */
function pzSyncMe() {
  if (!PZ.me) return;
  PZ.me.name = profile.nick;
  PZ.me.emoji = profile.emoji;
  const el = PZ.els.get(PZ.me.id);
  if (el && el.name) el.name.textContent = profile.nick;
}

function openPlaza() { startPlaza(); show('plaza'); }

/* ---------- 입력 ---------- */
const PZ_KEYS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
  A: 'left', D: 'right', W: 'up', S: 'down',
};

document.addEventListener('keydown', (e) => {
  if (!PZ.on) return;
  /* 입력칸에서 난 키는 여기서 처리하지 않는다.
     activeElement 대신 e.target 을 보는 이유: 전송하면서 포커스를 빼면
     버블링이 올라올 때 activeElement 가 이미 바뀌어 Enter 가 다시 잡힌다 */
  if (e.target === $('#plaza-chat-text')) return;

  const dj = $('#overlay-dj');
  if (!dj.hidden) {                        /* 곡 선택 중에는 캐릭터가 움직이지 않는다 */
    if (e.key === 'Escape') { pzCloseDJ(); e.preventDefault(); }
    return;
  }

  if (e.key === ' ' || e.code === 'Space') {
    if (PZ.riding) { e.preventDefault(); pzDismount(); return; }
    const spot = pzNearSpot();
    if (!spot) return;                     /* 아무 지점에서도 멀면 그냥 무시 */
    e.preventDefault();
    if (spot.kind === 'dj') pzOpenDJ();
    else pzRide(spot);
    return;
  }

  if (PZ_EMOTES[e.key]) {                  /* 숫자키로 표정 */
    e.preventDefault();
    pzEmote(PZ.me, PZ_EMOTES[e.key]);
    return;
  }

  if (e.key === 'Enter') {                 /* Enter 로 채팅 열기 */
    PZ.keys.clear();                       /* 누르고 있던 방향키를 놓은 것으로 */
    $('#plaza-chat-text').focus();
    e.preventDefault();
    return;
  }
  const dir = PZ_KEYS[e.key];
  if (dir) { PZ.keys.add(dir); e.preventDefault(); }
});
document.addEventListener('keyup', (e) => {
  const dir = PZ_KEYS[e.key];
  if (dir) PZ.keys.delete(dir);
});
window.addEventListener('blur', () => PZ.keys.clear());

$('#btn-plaza-back').onclick = () => {
  stopPlaza(); renderPlayground(); show('playground'); Sound.play('click');
};
/* ---------- 채팅 글자 크기 ---------- */
const PZ_FONTS = [12, 13, 15, 17, 19];
const PZ_FONT_KEY = SAVE_KEY + '.pzfont';
let pzFont = 2;                          /* 기본 15px */
try {
  /* 저장값이 없으면 null 인데 Number(null) 은 0 이라 그냥 쓰면 최소 크기로 시작한다 */
  const raw = localStorage.getItem(PZ_FONT_KEY);
  const v = raw === null ? NaN : Number(raw);
  if (Number.isInteger(v) && v >= 0 && v < PZ_FONTS.length) pzFont = v;
} catch {}

function pzApplyFont() {
  const px = PZ_FONTS[pzFont];
  $('.pz-chat').style.setProperty('--pz-chat-fs', px + 'px');
  $('#pz-font-label').textContent = px;
  $('#btn-pz-font-down').disabled = pzFont === 0;
  $('#btn-pz-font-up').disabled = pzFont === PZ_FONTS.length - 1;
  try { localStorage.setItem(PZ_FONT_KEY, pzFont); } catch {}
}

function pzFontStep(d) {
  const next = pzFont + d;
  if (next < 0 || next >= PZ_FONTS.length) return;
  pzFont = next;
  pzApplyFont();
  Sound.play('click');
  const log = $('#plaza-chat-log');
  log.scrollTop = log.scrollHeight;        /* 커지면 아래가 잘리므로 다시 맨 아래로 */
}

$('#btn-pz-font-down').onclick = () => pzFontStep(-1);
$('#btn-pz-font-up').onclick = () => pzFontStep(1);
pzApplyFont();

$('#btn-plaza-chat-send').onclick = pzSend;
$('#plaza-chat-text').onkeydown = (e) => {
  if (isComposing(e)) return;                /* 한글 조합 중 Enter 는 확정용 */
  if (e.key === 'Enter') {
    pzSend();
    /* 보내고 나면 포커스를 빼서 바로 방향키로 움직일 수 있게 한다.
       여기 머물면 이동 키가 전부 입력칸으로 들어가 캐릭터가 멈춰 버린다 */
    $('#plaza-chat-text').blur();
  }
  if (e.key === 'Escape') $('#plaza-chat-text').blur();
};
