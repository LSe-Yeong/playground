import comingSoonArt from '../../assets/coming-soon.webp'
import omtThumb from '../../assets/omt-thumb.webp'

/**
 * 허브에 올라가는 카드 (0-6). 프로토타입 app.js 의 GAMES 와 같은 순서·문구다.
 * 서버가 붙으면 GET /games 가 이 목록을 준다.
 */
export interface GameCardData {
  id: string
  name: string
  nameEn: string
  icon: string
  tone: string
  ready: boolean
  cta?: string
  badge?: string
  /** 카드 상단 그림. 놀이터만 인라인 SVG 라 따로 그린다 */
  imageUrl?: string
  description: string
  tags?: string[]
  players: string
  time: string
}

export const GAMES: GameCardData[] = [
  {
    id: 'plaza',
    name: '놀이터',
    nameEn: 'Plaza',
    icon: '🛝',
    tone: '#5bc236',
    ready: true,
    cta: '입장하기',
    badge: '상시 열림',
    description: '캐릭터를 움직이며 다른 사람들과 이야기하는 공간. 게임이 아니라 그냥 모이는 곳이다',
    tags: ['소통', '자유 이동', '채팅'],
    players: '',
    time: '자유',
  },
  {
    id: 'onemore',
    name: '한번더',
    nameEn: 'OneMoreTime',
    icon: '⛏',
    tone: '#f0553d',
    ready: true,
    imageUrl: omtThumb,
    description: '주사위 4개로 11개의 갱도를 파내려가, 가장 깊은 곳의 보물 3개를 먼저 찾는 사람이 이긴다',
    tags: ['주사위', '운과 배짱', '쉬운 규칙'],
    players: '2~6명',
    time: '15~20분',
  },
  { id: 'game2', name: '게임 2', nameEn: 'Coming Soon', icon: '🎲', tone: '#2d9cdb', ready: false,
    imageUrl: comingSoonArt, description: '다음 게임을 준비하고 있습니다', players: '—', time: '—' },
  { id: 'game3', name: '게임 3', nameEn: 'Coming Soon', icon: '🃏', tone: '#5bc236', ready: false,
    imageUrl: comingSoonArt, description: '다음 게임을 준비하고 있습니다', players: '—', time: '—' },
  { id: 'game4', name: '게임 4', nameEn: 'Coming Soon', icon: '🧩', tone: '#9b6bdb', ready: false,
    imageUrl: comingSoonArt, description: '다음 게임을 준비하고 있습니다', players: '—', time: '—' },
]
