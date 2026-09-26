import { colorHex } from '../features/plaza/colors'
import type { PlazaChatLine, PlazaMemberView, PlazaTrack } from '../features/plaza/types'

/**
 * 화면을 눈으로 볼 수 있게 채워 넣은 임시 값. 서버가 붙으면 통째로 사라진다.
 * 좌표는 걷는 범위(x 6~94, y 56~94) 안이고, 기구에 탄 사람은 그 기구의 자리에 둔다.
 */
export const MOCK_MEMBERS: PlazaMemberView[] = [
  { id: 7, nickname: '두더지4821', colorId: 'red', x: 80, y: 58, me: true },
  { id: 8, nickname: '곡괭이1007', colorId: 'blue', x: 58.5, y: 70,
    ride: { spot: 'seesaw', seat: 0 } },
  { id: 9, nickname: '광부3310', colorId: 'green', x: 69.5, y: 70,
    ride: { spot: 'seesaw', seat: 1 } },
  { id: 10, nickname: '탐험가5502', colorId: 'yellow', x: 14, y: 60,
    ride: { spot: 'swing', seat: 0 } },
  { id: 11, nickname: '랜턴8821', colorId: 'purple', x: 32, y: 84,
    bubble: '여기 분위기 좋다' },
  { id: 12, nickname: '수정2043', colorId: 'pink', x: 52, y: 90, walking: true, lean: 6,
    emote: '🎉' },
  { id: 13, nickname: '갱도6677', colorId: 'mint', x: 24, y: 66, walking: true, lean: -6 },
]

export const MOCK_CHAT: PlazaChatLine[] = [
  { id: 1, system: true, body: '대화가 초기화되었습니다' },
  { id: 2, nickname: '곡괭이1007', avatar: '💎', colorHex: colorHex('blue'), body: '안녕하세요~' },
  { id: 3, nickname: '랜턴8821', avatar: '🔦', colorHex: colorHex('purple'),
    body: '시소 같이 탈 사람?' },
  { id: 4, me: true, body: '저요!' },
  { id: 5, nickname: '광부3310', avatar: '⛏', colorHex: colorHex('green'), body: '지금 탔어요 ㅋㅋ' },
  { id: 6, nickname: '수정2043', avatar: '⭐', colorHex: colorHex('pink'),
    body: '노래 신청 받나요?' },
]

/** docs/prototype/audio 의 여섯 곡. 서버가 붙으면 GET /plaza/enter 의 tracks 로 온다 */
export const MOCK_TRACKS: PlazaTrack[] = [
  { trackId: 1, title: '신나는 하루', mood: 'Energetic', durationSec: 132 },
  { trackId: 2, title: '잔잔한 오후', mood: 'Calm', durationSec: 132 },
  { trackId: 3, title: '두근두근', mood: 'Tension', durationSec: 132 },
  { trackId: 4, title: '깡총깡총', mood: 'Cute', durationSec: 132 },
  { trackId: 5, title: '신비한 숲', mood: 'Mystic', durationSec: 132 },
  { trackId: 6, title: '웅장한 광장', mood: 'Epic', durationSec: 132 },
]

export const MOCK_NOW_PLAYING = MOCK_TRACKS[1]
export const MOCK_ELAPSED_SEC = 37
