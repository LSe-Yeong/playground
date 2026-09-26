/** 서버 → 클라이언트 메시지의 봉투 (허브 API 4장). */
export interface SocketEvent<T = unknown> {
  type: string
  /** 광장 안의 메시지는 광장 seq 를 쓴다. 광장 밖은 0 이다 */
  seq: number
  /** 서버 시각. 재생 위치 같은 시간 계산의 기준이 된다 */
  at: string
  payload: T
}

export type SocketListener = (event: SocketEvent) => void

/** 4xxx 는 애플리케이션이 정하는 종료 코드다 (SocketCloseStatus). */
export const CLOSE_SESSION_INVALID = 4401
export const CLOSE_ALREADY_CONNECTED = 4409
