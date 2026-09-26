import comingSoonArt from '../../assets/coming-soon.webp'
import omtThumb from '../../assets/omt-thumb.webp'
import plazaThumb from '../../assets/plaza-thumb.webp'

/**
 * 카드의 생김새. 이름 · 설명 · 인원은 서버(GET /games)가 주고, 그림과 버튼 문구처럼
 * 보이는 방식만 여기서 정한다. 서버 썸네일 주소 대신 번들에 든 그림을 쓰는 이유는
 * 그림이 화면의 일부라 코드와 함께 배포되는 편이 낫기 때문이다.
 */
export interface CardLook {
  icon: string
  tone: string
  imageUrl?: string
  cta?: string
  badge?: string
}

export const CARD_LOOKS: Record<string, CardLook> = {
  plaza: { icon: '🛝', tone: '#5bc236', imageUrl: plazaThumb, cta: '입장하기', badge: '상시 열림' },
  onemore: { icon: '⛏', tone: '#f0553d', imageUrl: omtThumb },
  game2: { icon: '🎲', tone: '#2d9cdb', imageUrl: comingSoonArt },
  game3: { icon: '🃏', tone: '#5bc236', imageUrl: comingSoonArt },
  game4: { icon: '🧩', tone: '#9b6bdb', imageUrl: comingSoonArt },
}

export const DEFAULT_LOOK: CardLook = { icon: '🎮', tone: '#9b6bdb' }

export const lookOf = (code: string) => CARD_LOOKS[code] ?? DEFAULT_LOOK
