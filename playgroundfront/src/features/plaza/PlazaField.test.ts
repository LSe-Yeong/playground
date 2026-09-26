import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlazaField } from './PlazaField'
import type { PlazaMember } from './plazaReducer'

const member = (id: number, x: number, y: number): PlazaMember => ({
  id, nickname: `두더지${id}`, avatar: '⛏', color: 'red',
  riding: null, spawn: { x, y, dir: 0 }, walking: false,
})

interface Sent {
  type: string
  payload: { x: number; y: number; dir: number }
}

/** rAF 와 시계를 손으로 돌린다. 프레임을 한 칸씩 밀어야 속도를 잴 수 있다 */
function harness() {
  let frame: FrameRequestCallback | null = null
  let clock = 0
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frame = callback
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {
    frame = null
  })
  vi.stubGlobal('performance', { now: () => clock })

  const sent: Sent[] = []
  const near: (string | null)[] = []
  const walking: Record<number, boolean>[] = []
  const field = new PlazaField({
    onNear: (spotId) => near.push(spotId),
    onWalking: (change) => walking.push(change),
  })
  field.setSender((type, payload) => sent.push({ type, payload: payload as Sent['payload'] }))

  return {
    field, sent, near, walking,
    /** 프레임 한 칸은 최대 50ms 로 잘린다 (PlazaField 가 dt 를 제한한다) */
    advance(steps: number, stepMs = 50) {
      for (let i = 0; i < steps; i++) {
        clock += stepMs
        frame?.(clock)
      }
    },
  }
}

/** paint() 결과를 읽기 위한 최소한의 DOM 흉내 */
function fakeNode() {
  const props: Record<string, string> = {}
  const node = {
    style: {
      setProperty(key: string, value: string) {
        props[key] = value
      },
      zIndex: '',
    },
  }
  return { node: node as unknown as HTMLElement, props, style: node.style }
}

beforeEach(() => {
  vi.stubGlobal('performance', { now: () => 0 })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('내 캐릭터 이동', () => {
  it('오른쪽 키를 1초 누르면 가로로 19% 간다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()
    field.setKey('right', true)

    advance(20)

    expect(field.myPosition()?.x).toBeCloseTo(69, 5)
    expect(field.myPosition()?.y).toBeCloseTo(70, 5)
  })

  it('세로는 원근 때문에 가로의 60% 만 간다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()
    field.setKey('down', true)

    advance(20)

    expect(field.myPosition()?.y).toBeCloseTo(70 + 19 * 0.6, 5)
  })

  it('걷는 범위를 넘지 않는다 — 넘겨 보내면 서버가 거절한다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 90, 92)], 7)
    field.start()
    field.setKey('right', true)
    field.setKey('down', true)

    advance(40)

    expect(field.myPosition()).toEqual({ x: 94, y: 94 })
  })

  it('대각선으로 눌러도 빨라지지 않는다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()
    field.setKey('right', true)
    field.setKey('down', true)

    advance(20)

    const moved = field.myPosition()!
    expect(moved.x - 50).toBeCloseTo((19 / Math.SQRT2), 5)
  })
})

describe('서버로 보내는 좌표', () => {
  it('매 프레임이 아니라 입력이 바뀔 때 보낸다', () => {
    const { field, sent, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()

    advance(5)
    expect(sent).toHaveLength(0) /* 가만히 있으면 보낼 게 없다 */

    field.setKey('right', true)
    advance(5)
    expect(sent).toHaveLength(1)
    expect(sent[0].type).toBe('plaza.move')
    expect(sent[0].payload.dir).toBe(1)
  })

  it('계속 걸으면 1초마다 한 번 더 보정해 보낸다', () => {
    const { field, sent, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()
    field.setKey('right', true)

    advance(5) /* 250ms */
    expect(sent).toHaveLength(1)

    advance(20) /* 1.25초 더 */
    expect(sent).toHaveLength(2)
  })

  it('멈추는 순간에도 마지막 자리를 보낸다', () => {
    const { field, sent, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()
    field.setKey('right', true)
    advance(4)
    field.setKey('right', false)
    advance(1)

    expect(sent).toHaveLength(2)
    expect(sent[1].payload.dir).toBe(0)
  })

  it('좌표는 소수 둘째 자리까지만 보낸다', () => {
    const { field, sent, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()
    field.setKey('right', true)
    advance(1)

    expect(sent[0].payload.x).toBe(Math.round(sent[0].payload.x * 100) / 100)
  })
})

describe('남의 좌표', () => {
  it('받은 자리로 순간이동시키지 않고 100ms 에 걸쳐 이어 준다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 10, 60), member(8, 50, 70)], 7)
    const other = fakeNode()
    field.attach(8, other.node)
    field.start()

    field.applyMoves([{ id: 8, x: 60, y: 70, dir: 1 }])
    advance(1) /* 50ms — 절반쯤 와 있어야 한다 */

    const half = Number(other.props['--x'].replace('%', ''))
    expect(half).toBeGreaterThan(50)
    expect(half).toBeLessThan(60)

    advance(1) /* 100ms 째 — 정확히 도착해 있어야 한다 */
    expect(Number(other.props['--x'].replace('%', ''))).toBeCloseTo(60, 5)
  })

  it('내 좌표는 서버가 돌려줘도 무시한다 — 내 캐릭터는 내가 먼저 움직인다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()

    field.applyMoves([{ id: 7, x: 10, y: 60, dir: 0 }])
    advance(2)

    expect(field.myPosition()).toEqual({ x: 50, y: 70 })
  })

  it('거절당했을 때는 서버가 아는 자리로 되돌린다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()

    field.snapMe(42.5, 71.2)
    advance(1)

    expect(field.myPosition()).toEqual({ x: 42.5, y: 71.2 })
  })

  it('깊이는 y 로 정한다 — 아래에 있을수록 앞이다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 50, 70), member(8, 50, 90)], 7)
    const back = fakeNode()
    const front = fakeNode()
    field.attach(7, back.node)
    field.attach(8, front.node)
    field.start()

    advance(1)

    expect(Number(front.style.zIndex)).toBeGreaterThan(Number(back.style.zIndex))
  })
})

describe('기구와 안내', () => {
  it('기구에 앉으면 그 자리 좌표로 옮기고 누르던 키를 놓는다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 64, 74)], 7)
    field.start()
    field.setKey('right', true)

    field.setRiding(7, 'seesaw', 1)
    advance(5)

    expect(field.myPosition()).toEqual({ x: 69.5, y: 70 })
  })

  it('내리면 서버가 알려준 자리에 선다', () => {
    const { field, advance } = harness()
    field.reset([member(7, 64, 74)], 7)
    field.start()
    field.setRiding(7, 'seesaw', 0)

    field.setStanding(7, 64, 76)
    advance(1)

    expect(field.myPosition()).toEqual({ x: 64, y: 76 })
  })

  it('가까운 지점이 바뀔 때만 알린다', () => {
    const { field, near, advance } = harness()
    field.reset([member(7, 50, 70)], 7)
    field.start()

    advance(1)
    expect(near).toEqual([]) /* 아무 데서도 멀면 알릴 것이 없다 */

    field.snapMe(64, 74) /* 시소 위 */
    advance(1)
    expect(near).toEqual(['seesaw'])

    advance(5) /* 그대로 서 있으면 더 알리지 않는다 */
    expect(near).toHaveLength(1)
  })

  it('타고 있는 동안에는 안내가 내리기로 바뀐다', () => {
    const { field, near, advance } = harness()
    field.reset([member(7, 64, 74)], 7)
    field.start()
    advance(1)

    field.setRiding(7, 'seesaw', 0)
    advance(1)

    expect(near.at(-1)).toBe('riding')
  })
})
