/** 광장의 상수. 좌표·색·곡은 백엔드(docs/erd/playground.md)와 같은 값이어야 한다. */

export const PZ_CAPACITY = 20

/** 걸어 다닐 수 있는 범위(%). 위쪽은 하늘·언덕이라 걸을 수 없다 (P-2) */
export const PZ_BOUNDS = { x0: 6, x1: 94, y0: 56, y1: 94 }

/** 다가가면 무언가 할 수 있는 지점. 반경을 가로·세로 따로 두는 이유는 ERD 부록 A 에 있다 */
export const PZ_SPOTS = [
  { id: 'dj', kind: 'dj', label: '곡 선택', x: 82, y: 49, rx: 14, ry: 10, cy: 36 },
  { id: 'swing', kind: 'ride', label: '타기', x: 16, y: 66, rx: 11, ry: 8, cy: 52, seats: 1 },
  { id: 'seesaw', kind: 'ride', label: '타기', x: 64, y: 74, rx: 11, ry: 8, cy: 66, seats: 2 },
  { id: 'merry', kind: 'ride', label: '타기', x: 9, y: 88, rx: 10, ry: 7, cy: 78, seats: 1 },
] as const

/** 숫자 키 1~4 로 낸다 (P-10) */
export const PZ_EMOTES: Record<number, string> = { 1: '👋', 2: '❓', 3: '😄', 4: '🎉' }

/** 채팅 글자 크기 단계. 기본은 가운데인 15px (P-8) */
export const PZ_FONTS = [12, 13, 15, 17, 19]
export const PZ_FONT_DEFAULT = 2

/** 10분마다 대화를 비운다 (P-23) */
export const PZ_CHAT_RESET_MIN = 10

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'

export const PZ_TOD_ICON: Record<TimeOfDay, string> = {
  dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙',
}

export function timeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 17) return 'day'
  if (hour >= 17 && hour < 19) return 'dusk'
  return 'night'
}

/** 12시간제 AM/PM. 0시는 12 AM, 12시는 12 PM 이다 (P-20) */
export function clockText(date: Date) {
  const h24 = date.getHours()
  const hour = h24 % 12 || 12
  return `${hour}:${String(date.getMinutes()).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

export const volumeIcon = (volume: number) =>
  volume === 0 ? '🔇' : volume < 40 ? '🔈' : volume < 75 ? '🔉' : '🔊'

export const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
