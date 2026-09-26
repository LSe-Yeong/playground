/** 광장의 상수. 좌표·색·곡은 백엔드(docs/erd/playground.md)와 같은 값이어야 한다. */

export const PZ_CAPACITY = 20

/** 걸어 다닐 수 있는 범위(%). 위쪽은 하늘·언덕이라 걸을 수 없다 (P-2) */
export const PZ_BOUNDS = { x0: 6, x1: 94, y0: 56, y1: 94 }

/**
 * 다가가면 무언가 할 수 있는 지점. 반경을 가로·세로 따로 두는 이유는 ERD 부록 A 에 있다.
 *
 * 자리 좌표는 서버가 주지 않는다 — 서버는 자리 번호만 배정하고, 그 번호가 화면 어디인지는
 * 그림을 아는 쪽이 안다. needs 는 기구가 움직이는 데 필요한 인원이다 (시소는 둘).
 */
export const PZ_SPOTS = [
  { id: 'dj', kind: 'dj', label: '곡 선택', x: 82, y: 49, rx: 14, ry: 10, cy: 36,
    needs: 0, seats: [] },
  { id: 'swing', kind: 'ride', label: '타기', x: 16, y: 66, rx: 11, ry: 8, cy: 52,
    needs: 1, seats: [{ x: 14, y: 60 }, { x: 19, y: 61 }] },
  { id: 'seesaw', kind: 'ride', label: '타기', x: 64, y: 74, rx: 11, ry: 8, cy: 66,
    needs: 2, seats: [{ x: 58.5, y: 70 }, { x: 69.5, y: 70 }] },
  { id: 'merry', kind: 'ride', label: '타기', x: 9, y: 88, rx: 10, ry: 7, cy: 78,
    needs: 1, seats: [{ x: 9, y: 84 }] },
] as const

export type PlazaSpot = (typeof PZ_SPOTS)[number]

export const findSpot = (id: string | null | undefined) =>
  PZ_SPOTS.find((spot) => spot.id === id) ?? null

/** 반경 안에 든 지점 중 가장 가까운 하나. 축마다 반경이 달라 정규화해서 잰다 */
export function nearestSpot(x: number, y: number): PlazaSpot | null {
  let best: PlazaSpot | null = null
  let bestDistance = Infinity
  for (const spot of PZ_SPOTS) {
    const distance = Math.hypot((x - spot.x) / spot.rx, (y - spot.y) / spot.ry)
    if (distance <= 1 && distance < bestDistance) {
      best = spot
      bestDistance = distance
    }
  }
  return best
}

/** 숫자 키 1~4 로 낸다 (P-10) */
export const PZ_EMOTES: Record<number, string> = { 1: '👋', 2: '❓', 3: '😄', 4: '🎉' }
export const PZ_EMOTE_MS = 2200
export const PZ_BUBBLE_MS = 4200

/** 초당 화면 너비의 19%. 세로는 원근 때문에 그 60% 다 (P-2) */
export const PZ_SPEED = 19
export const PZ_SPEED_Y_RATIO = 0.6

/** 남의 좌표는 100ms 마다 묶여 오므로 그 시간에 걸쳐 이어 준다. 대입하면 초당 10번 끊긴다 */
export const PZ_INTERP_SEC = 0.1

/** 입력이 바뀔 때 말고도 1초마다 한 번 좌표를 보정해 보낸다 (M-P10) */
export const PZ_MOVE_SYNC_MS = 1000

/** 광장은 사라지지 않아 대화가 쌓인다. 화면에는 최근 것만 남긴다 */
export const PZ_CHAT_KEEP = 60

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
