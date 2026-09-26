import { describe, expect, it } from 'vitest'
import { PZ_COLORS, colorHex } from './colors'
import { PZ_CAPACITY, clockText, nearestSpot, timeOfDay } from './constants'

describe('가까운 지점', () => {
  it('반경 안이면 잡고 밖이면 놓는다 — 반경은 가로·세로가 다르다', () => {
    /* 그네는 (16, 66) 에 가로 11 · 세로 8 */
    expect(nearestSpot(16, 66)?.id).toBe('swing')
    expect(nearestSpot(26, 66)?.id).toBe('swing')
    expect(nearestSpot(28, 66)).toBeNull()
    expect(nearestSpot(16, 75)).toBeNull()
  })

  it('두 지점에 함께 걸리면 가까운 쪽을 고른다', () => {
    /* DJ(82,49) 와 시소(64,74) 사이 — DJ 쪽에 더 붙어 선다 */
    expect(nearestSpot(80, 56)?.id).toBe('dj')
  })
})

describe('시간대', () => {
  it('새벽 · 낮 · 저녁 · 밤으로 가른다', () => {
    expect(timeOfDay(5)).toBe('dawn')
    expect(timeOfDay(6)).toBe('dawn')
    expect(timeOfDay(7)).toBe('day')
    expect(timeOfDay(16)).toBe('day')
    expect(timeOfDay(17)).toBe('dusk')
    expect(timeOfDay(19)).toBe('night')
    expect(timeOfDay(0)).toBe('night')
  })

  it('0시는 12 AM, 12시는 12 PM 이다', () => {
    expect(clockText(new Date(2026, 8, 26, 0, 5))).toBe('12:05 AM')
    expect(clockText(new Date(2026, 8, 26, 12, 5))).toBe('12:05 PM')
    expect(clockText(new Date(2026, 8, 26, 16, 25))).toBe('4:25 PM')
  })
})

describe('캐릭터 색', () => {
  it('정원보다 많아야 마지막에 들어온 사람도 고를 여지가 있다', () => {
    expect(PZ_COLORS.length).toBeGreaterThan(PZ_CAPACITY)
  })

  it('코드가 겹치지 않는다 — 한 색은 한 사람만 쓴다', () => {
    expect(new Set(PZ_COLORS.map((color) => color.id)).size).toBe(PZ_COLORS.length)
  })

  it('24색 모두 색값이 있다 — 코드를 CSS 에 그대로 넣으면 엉뚱한 색이 된다', () => {
    for (const color of PZ_COLORS) expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i)
    expect(colorHex('red')).toBe('#f0553d')
    /* 없는 코드는 첫 색으로 떨어진다 — 화면이 비는 것보다 낫다 */
    expect(colorHex('없는색')).toBe('#f0553d')
  })
})
