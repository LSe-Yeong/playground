import { createContext, useContext } from 'react'
import type { SocketListener } from '../socket/types'
import type { Profile } from '../profile'

export type ConnectionStatus = 'connecting' | 'ready' | 'blocked' | 'failed'

export interface ConnectionValue {
  status: ConnectionStatus
  /** 연결이 새로 맺어질 때마다 1씩 오른다. 광장은 이 값이 바뀌면 다시 입장한다 */
  generation: number
  profile: Profile
  saveProfile: (next: Partial<Profile>) => Promise<void>
  send: (type: string, payload?: unknown) => void
  subscribe: (listener: SocketListener) => () => void
  /** 서버 시각 추정치. 재생 위치처럼 서버와 같은 시점을 봐야 하는 계산에 쓴다 */
  serverNow: () => number
}

export const ConnectionContext = createContext<ConnectionValue | null>(null)

export function useConnection() {
  const value = useContext(ConnectionContext)
  if (!value) throw new Error('ConnectionProvider 안에서만 쓸 수 있다')
  return value
}
