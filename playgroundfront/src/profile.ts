/** 프로필에서 고를 수 있는 이모지 16종 (0-7). 순서는 선택 모달의 표시 순서다. */
export const AVATARS = [
  '⛏', '💎', '🔦', '🪨', '⭐', '🔥', '🍀', '🧭',
  '🐹', '🦊', '🐻', '🐸', '🐧', '🦉', '🐢', '🦔',
] as const

export interface Profile {
  nickname: string
  avatar: string
}

const NICK_WORDS = ['두더지', '곡괭이', '광부', '탐험가', '보물사냥꾼', '랜턴', '수정', '갱도']

/** 이름 배열에서 하나 + 네 자리 숫자. 중복을 허용하므로 겹쳐도 괜찮다 (0-8) */
export const randomNickname = () =>
  NICK_WORDS[Math.floor(Math.random() * NICK_WORDS.length)] +
  String(Math.floor(1000 + Math.random() * 9000))
