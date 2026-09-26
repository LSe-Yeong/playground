/** 백엔드 응답 모양. docs/api/api.md · docs/api/playground.md 와 같아야 한다. */

export interface SessionResponse {
  nickname: string
  avatar: string
}

export interface GameResponse {
  code: string
  name: string
  nameEn: string
  description: string
  thumbnailUrl: string | null
  minPlayers: number
  maxPlayers: number
  playMinutes: string | null
  playable: boolean
  tags: string[]
  /** 인원을 셀 수 있는 카드만 값이 있다 (놀이터) */
  liveCount: number | null
  capacity: number | null
}

export interface GameListResponse {
  games: GameResponse[]
}

export interface PlazaRiding {
  spot: string
  seat: number
}

export interface PlazaMemberResponse {
  id: number
  nickname: string
  avatar: string
  color: string
  x: number
  y: number
  dir: number
  riding: PlazaRiding | null
}

export interface PlazaMusicResponse {
  trackId: number
  title: string
  mood: string
  srcUrl: string
  durationSec: number
  /** 그 곡이 시작된 서버 시각. 재생 위치는 여기서 계산한다 (P-17) */
  startedAt: string
}

export interface PlazaTrackResponse {
  trackId: number
  title: string
  mood: string
  durationSec: number
}

export interface PlazaChatResponse {
  id: number
  playerId: number
  nickname: string
  avatar: string
  color: string
  body: string
  at: string
}

export interface PlazaStateResponse {
  capacity: number
  /** 받는 사람 자신의 memberId. 닉네임 중복을 허용하므로 이름으로 "나" 를 찾으면 틀린다 */
  meId: number
  members: PlazaMemberResponse[]
  music: PlazaMusicResponse | null
  tracks: PlazaTrackResponse[]
  chat: PlazaChatResponse[]
  chatResetAt: string
  colors: string[]
}
