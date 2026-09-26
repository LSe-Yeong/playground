import {
  PZ_BOUNDS, PZ_INTERP_SEC, PZ_MOVE_SYNC_MS, PZ_SPEED, PZ_SPEED_Y_RATIO,
  findSpot, nearestSpot,
} from './constants'
import type { PlazaMember } from './plazaReducer'

export type Direction = 'left' | 'right' | 'up' | 'down'

interface Body {
  /** 지금 화면에 그린 자리 */
  x: number
  y: number
  /** 좌표가 왔을 때 서 있던 자리. 여기서 목표까지를 100ms 에 나눠 간다 */
  fromX: number
  fromY: number
  /** 서버가 알려준 자리 */
  targetX: number
  targetY: number
  /** 0 에서 1 로 간다. 1 이면 목표에 닿았다 */
  progress: number
  lean: number
  walking: boolean
  riding: boolean
}

interface Options {
  /** 가까이 간 지점이 바뀔 때만 부른다 */
  onNear: (spotId: string | null) => void
  /** 걷기 시작·멈춤. 좌표와 달리 자주 바뀌지 않아 React 가 들고 있어도 된다 */
  onWalking: (walking: Record<number, boolean>) => void
}

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value

const round2 = (value: number) => Math.round(value * 100) / 100

/**
 * 캐릭터 좌표만 따로 맡는다.
 *
 * 초당 60번 자리가 바뀌는 값을 React 상태에 두면 20명 기준으로 감당이 안 된다.
 * 그래서 좌표는 여기서 들고 DOM 에 바로 쓰고, React 는 누가 있는지 · 무슨 색인지처럼
 * 가끔 바뀌는 것만 그린다.
 *
 * 내 캐릭터는 서버 확인을 기다리지 않고 누른 즉시 움직인다. 서버에는 입력이 바뀔 때와
 * 1초마다 한 번만 알린다 (M-P10).
 */
export class PlazaField {
  private options: Options
  private sender: (type: string, payload?: unknown) => void = () => {}
  private bodies = new Map<number, Body>()
  private nodes = new Map<number, HTMLElement>()
  private keys = new Set<Direction>()
  private meId: number | null = null
  private frame = 0
  private lastFrameAt = 0
  private sentAt = 0
  private sentDx = 0
  private sentDy = 0
  private near: string | null = null
  private walkChanges: Record<number, boolean> = {}

  constructor(options: Options) {
    this.options = options
  }

  /** 소켓은 다시 붙을 수 있어 보내는 함수가 바뀐다. 필드 자체는 그대로 둔다 */
  setSender(sender: (type: string, payload?: unknown) => void) {
    this.sender = sender
  }

  start() {
    if (this.frame) return
    this.lastFrameAt = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  stop() {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.frame = 0
    this.keys.clear()
    this.near = null
  }

  /** 입장 응답으로 광장을 처음 채울 때 */
  reset(members: PlazaMember[], meId: number) {
    this.bodies.clear()
    this.meId = meId
    this.near = null
    for (const member of members) this.add(member)
  }

  add(member: PlazaMember) {
    const seat = member.riding ? findSpot(member.riding.spot)?.seats[member.riding.seat] : null
    const x = seat?.x ?? member.spawn.x
    const y = seat?.y ?? member.spawn.y
    this.bodies.set(member.id, {
      x, y, fromX: x, fromY: y, targetX: x, targetY: y, progress: 1,
      lean: member.spawn.dir * 6,
      walking: false,
      riding: !!member.riding,
    })
  }

  remove(memberId: number) {
    this.bodies.delete(memberId)
    this.nodes.delete(memberId)
  }

  /** 화면에 붙은 DOM 을 받아 둔다. 프레임마다 여기에 좌표를 쓴다 */
  attach(memberId: number, node: HTMLElement | null) {
    if (node) this.nodes.set(memberId, node)
    else this.nodes.delete(memberId)
  }

  /** 100ms 배치로 온 남의 좌표 */
  applyMoves(moves: { id: number; x: number; y: number; dir: number }[]) {
    for (const move of moves) {
      const body = this.bodies.get(move.id)
      if (!body || move.id === this.meId) continue
      body.fromX = body.x
      body.fromY = body.y
      body.targetX = move.x
      body.targetY = move.y
      body.progress = 0
      body.lean = move.dir * 6
    }
  }

  /** 이동이 거절됐을 때 서버가 아는 자리로 되돌린다 */
  snapMe(x: number, y: number) {
    const body = this.meId === null ? null : this.bodies.get(this.meId)
    if (!body) return
    body.x = body.fromX = body.targetX = x
    body.y = body.fromY = body.targetY = y
    body.progress = 1
  }

  setRiding(memberId: number, spotId: string, seat: number) {
    const body = this.bodies.get(memberId)
    const place = findSpot(spotId)?.seats[seat]
    if (!body || !place) return
    body.x = body.fromX = body.targetX = place.x
    body.y = body.fromY = body.targetY = place.y
    body.progress = 1
    body.lean = 0
    body.riding = true
    this.setWalking(memberId, body, false)
    if (memberId === this.meId) {
      this.keys.clear()
      this.near = null /* 안내를 "내리기" 로 다시 그린다 */
    }
  }

  setStanding(memberId: number, x: number, y: number) {
    const body = this.bodies.get(memberId)
    if (!body) return
    body.x = body.fromX = body.targetX = x
    body.y = body.fromY = body.targetY = y
    body.progress = 1
    body.riding = false
    if (memberId === this.meId) this.near = null
  }

  setKey(direction: Direction, down: boolean) {
    if (down) this.keys.add(direction)
    else this.keys.delete(direction)
  }

  clearKeys() {
    this.keys.clear()
  }

  myPosition() {
    const body = this.meId === null ? null : this.bodies.get(this.meId)
    return body ? { x: body.x, y: body.y } : null
  }

  private tick = (now: number) => {
    const dt = Math.min(0.05, (now - this.lastFrameAt) / 1000 || 0)
    this.lastFrameAt = now

    this.moveMe(dt, now)
    this.followOthers(dt)
    this.paint()
    this.reportNear()
    this.reportWalking()

    this.frame = requestAnimationFrame(this.tick)
  }

  private moveMe(dt: number, now: number) {
    const meId = this.meId
    if (meId === null) return
    const body = this.bodies.get(meId)
    if (!body) return
    if (body.riding) {
      this.setWalking(meId, body, false)
      return
    }

    const dx = (this.keys.has('right') ? 1 : 0) - (this.keys.has('left') ? 1 : 0)
    const dy = (this.keys.has('down') ? 1 : 0) - (this.keys.has('up') ? 1 : 0)

    if (dx || dy) {
      const length = Math.hypot(dx, dy) || 1
      body.x = clamp(body.x + (dx / length) * PZ_SPEED * dt, PZ_BOUNDS.x0, PZ_BOUNDS.x1)
      body.y = clamp(
        body.y + (dy / length) * PZ_SPEED * PZ_SPEED_Y_RATIO * dt,
        PZ_BOUNDS.y0, PZ_BOUNDS.y1,
      )
      body.lean = dx ? (dx > 0 ? 6 : -6) : 0
      this.setWalking(meId, body, true)
    } else {
      body.lean = 0
      this.setWalking(meId, body, false)
    }
    body.fromX = body.targetX = body.x
    body.fromY = body.targetY = body.y
    body.progress = 1

    /* 입력이 바뀐 순간과 1초마다 한 번. 매 프레임 보내면 초당 60통이 된다 */
    const inputChanged = dx !== this.sentDx || dy !== this.sentDy
    const overdue = (dx || dy) && now - this.sentAt >= PZ_MOVE_SYNC_MS
    if (inputChanged || overdue) {
      this.sentDx = dx
      this.sentDy = dy
      this.sentAt = now
      this.sender('plaza.move', {
        x: round2(body.x),
        y: round2(body.y),
        dir: dx > 0 ? 1 : dx < 0 ? -1 : 0,
      })
    }
  }

  /**
   * 받은 자리로 순간이동시키지 않고 100ms 에 걸쳐 이어 준다. 그냥 대입하면 초당 10번 끊긴다.
   * 남은 거리에 비례해 줄이는 방식은 끝까지 닿지 않아, 지난 시간으로 나눠 간다.
   */
  private followOthers(dt: number) {
    for (const [id, body] of this.bodies) {
      if (id === this.meId || body.riding) continue
      if (body.progress >= 1) {
        this.setWalking(id, body, false)
        continue
      }
      body.progress = Math.min(1, body.progress + dt / PZ_INTERP_SEC)
      body.x = body.fromX + (body.targetX - body.fromX) * body.progress
      body.y = body.fromY + (body.targetY - body.fromY) * body.progress
      const moved = Math.hypot(body.targetX - body.fromX, body.targetY - body.fromY)
      this.setWalking(id, body, body.progress < 1 && moved >= 0.05)
    }
  }

  private paint() {
    for (const [id, body] of this.bodies) {
      const node = this.nodes.get(id)
      if (!node) continue
      node.style.setProperty('--x', `${body.x.toFixed(2)}%`)
      node.style.setProperty('--y', `${body.y.toFixed(2)}%`)
      node.style.setProperty('--lean', `${body.lean.toFixed(1)}deg`)
      /* 아래에 있을수록 앞이다. 놀이기구도 같은 기준을 쓴다 */
      node.style.zIndex = String(Math.round(body.y * 10))
    }
  }

  private reportNear() {
    const body = this.meId === null ? null : this.bodies.get(this.meId)
    if (!body) return
    const spot = body.riding ? null : nearestSpot(body.x, body.y)
    const id = body.riding ? 'riding' : (spot?.id ?? null)
    if (id === this.near) return
    this.near = id
    this.options.onNear(id)
  }

  private setWalking(id: number, body: Body, walking: boolean) {
    if (body.walking === walking) return
    body.walking = walking
    this.walkChanges[id] = walking
  }

  private reportWalking() {
    const changes = this.walkChanges
    if (Object.keys(changes).length === 0) return
    this.walkChanges = {}
    this.options.onWalking(changes)
  }
}
