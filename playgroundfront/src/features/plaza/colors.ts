/**
 * 캐릭터 색 24종 (P-24). 순서·코드는 docs/erd/playground.md 부록 E 와 같아야 한다.
 *
 * 앞의 여덟은 프로토타입이 쓰던 색 그대로다. 명세가 코드만 정하고 색값은 정하지 않아,
 * 나머지 열여섯은 같은 팔레트 안에서 골랐다 — 바꿀 값이 있으면 여기만 고치면 된다.
 */
export interface PlazaColor {
  id: string
  name: string
  hex: string
}

export const PZ_COLORS: PlazaColor[] = [
  { id: 'red',    name: '빨강',   hex: '#f0553d' },
  { id: 'blue',   name: '파랑',   hex: '#2d9cdb' },
  { id: 'green',  name: '초록',   hex: '#5bc236' },
  { id: 'yellow', name: '노랑',   hex: '#ffcf33' },
  { id: 'purple', name: '보라',   hex: '#9b6bdb' },
  { id: 'pink',   name: '분홍',   hex: '#ff7eb3' },
  { id: 'teal',   name: '청록',   hex: '#25c2b0' },
  { id: 'orange', name: '주황',   hex: '#ff9a3c' },
  { id: 'navy',   name: '남색',   hex: '#2f4b8f' },
  { id: 'mint',   name: '민트',   hex: '#6fe0b0' },
  { id: 'coral',  name: '산호',   hex: '#ff8a73' },
  { id: 'lime',   name: '연두',   hex: '#a8e337' },
  { id: 'sky',    name: '하늘',   hex: '#7fc9ec' },
  { id: 'indigo', name: '인디고', hex: '#5a54c9' },
  { id: 'violet', name: '자주',   hex: '#c77df0' },
  { id: 'rose',   name: '장미',   hex: '#f25f8a' },
  { id: 'brown',  name: '갈색',   hex: '#a9743f' },
  { id: 'olive',  name: '올리브', hex: '#8a9a3b' },
  { id: 'gold',   name: '금색',   hex: '#f0b23c' },
  { id: 'cyan',   name: '시안',   hex: '#3ec1d8' },
  { id: 'beige',  name: '베이지', hex: '#eed8ae' },
  { id: 'gray',   name: '회색',   hex: '#9aa9b4' },
  { id: 'black',  name: '검정',   hex: '#3a4a55' },
  { id: 'white',  name: '흰색',   hex: '#f4f8fa' },
]

/** 한 페이지에 10개, 3페이지(10 · 10 · 4) (P-24) */
export const PZ_COLORS_PER_PAGE = 10

export const colorHex = (id: string) =>
  (PZ_COLORS.find((color) => color.id === id) ?? PZ_COLORS[0]).hex
