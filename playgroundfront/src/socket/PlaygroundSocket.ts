import { SOCKET_URL } from '../api/client'
import type { SocketEvent, SocketListener } from './types'

/**
 * 앱에 들어오자마자 연결해 끝까지 유지하는 소켓 하나 (허브 API 4장).
 * 카드가 여럿이어도 소켓은 하나이고, 메시지의 type 으로 갈라 쓴다.
 *
 * 다시 연결할지는 이 클래스가 정하지 않는다. 세션을 다시 받아야 하는지
 * (끊기면 서버가 세션을 지운다) 는 바깥이 알기 때문이다.
 */
export class PlaygroundSocket {
  private socket: WebSocket | null = null
  private listeners = new Set<SocketListener>()
  private closeHandler: ((code: number) => void) | null = null
  private closedByUs = false

  /** 열릴 때까지 기다린다. 열리기 전에 닫히면 그 종료 코드로 실패한다 */
  connect() {
    this.closedByUs = false
    return new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(SOCKET_URL)
      this.socket = socket
      let opened = false

      socket.onopen = () => {
        opened = true
        resolve()
      }
      socket.onmessage = (message) => this.dispatch(message.data)
      socket.onclose = (event) => {
        this.socket = null
        if (!opened) {
          reject(new SocketClosedError(event.code))
          return
        }
        if (!this.closedByUs) this.closeHandler?.(event.code)
      }
      /* onerror 뒤에는 반드시 onclose 가 오므로 여기서는 아무것도 하지 않는다 */
    })
  }

  send(type: string, payload: unknown = {}) {
    if (this.socket?.readyState !== WebSocket.OPEN) return false
    this.socket.send(JSON.stringify({ type, payload }))
    return true
  }

  close() {
    this.closedByUs = true
    this.socket?.close(1000, 'left')
    this.socket = null
  }

  get connected() {
    return this.socket?.readyState === WebSocket.OPEN
  }

  subscribe(listener: SocketListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onClose(handler: (code: number) => void) {
    this.closeHandler = handler
  }

  private dispatch(raw: unknown) {
    if (typeof raw !== 'string') return
    let event: SocketEvent
    try {
      event = JSON.parse(raw) as SocketEvent
    } catch {
      return
    }
    if (!event?.type) return
    for (const listener of this.listeners) listener(event)
  }
}

export class SocketClosedError extends Error {
  readonly code: number

  constructor(code: number) {
    super(`소켓이 ${code} 로 닫혔습니다`)
    this.name = 'SocketClosedError'
    this.code = code
  }
}
