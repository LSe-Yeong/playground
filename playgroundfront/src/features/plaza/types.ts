export type RideSpot = 'swing' | 'seesaw' | 'merry'

/** 채팅 한 줄. 서버가 준 것과 "대화가 비워집니다" 같은 안내를 함께 담는다 */
export interface PlazaChatLine {
  id: number
  /** 사람이 쓰지 않은 줄 */
  system?: boolean
  me?: boolean
  nickname?: string
  avatar?: string
  colorHex?: string
  body: string
}
