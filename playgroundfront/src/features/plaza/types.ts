export type RideSpot = 'swing' | 'seesaw' | 'merry'

/** 광장에 있는 사람 하나를 그리는 데 필요한 값 */
export interface PlazaMemberView {
  id: number
  nickname: string
  colorId: string
  /** 걷는 범위 안의 위치(%) */
  x: number
  y: number
  /** 걸을 때 몸이 기우는 각도 */
  lean?: number
  walking?: boolean
  ride?: { spot: RideSpot; seat: 0 | 1; solo?: boolean }
  /** 머리 위 말풍선 (P-7) */
  bubble?: string | null
  /** 머리 위 감정 표현 (P-10) */
  emote?: string | null
  me?: boolean
}

export interface PlazaChatLine {
  id: number
  /** 대화 초기화 안내처럼 사람이 쓰지 않은 줄 */
  system?: boolean
  me?: boolean
  nickname?: string
  avatar?: string
  colorHex?: string
  body: string
}

export interface PlazaTrack {
  trackId: number
  title: string
  mood: string
  durationSec: number
}
