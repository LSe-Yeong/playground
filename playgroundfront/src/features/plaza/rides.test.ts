import { describe, expect, it } from 'vitest'
import type { PlazaMember } from './plazaReducer'
import { rideSummary, rigClass } from './rides'
import type { RideSpot } from './types'

const rider = (id: number, spot: RideSpot, seat: number): PlazaMember => ({
  id, nickname: `두더지${id}`, avatar: '⛏', color: 'red',
  riding: { spot, seat }, spawn: { x: 50, y: 70, dir: 0 }, walking: false,
})

const stander = (id: number): PlazaMember => ({ ...rider(id, 'swing', 0), riding: null })

describe('기구 움직임', () => {
  it('시소는 둘이 앉아야 움직인다', () => {
    const { rigs, soloSpots } = rideSummary([rider(1, 'seesaw', 0), rider(2, 'seesaw', 1)])

    expect(rigs.seesaw).toBe('riding')
    expect(soloSpots.has('seesaw')).toBe(false)
  })

  it('시소에 혼자면 그 자리 쪽으로 기운 채 멈춘다', () => {
    expect(rideSummary([rider(1, 'seesaw', 0)]).rigs.seesaw).toBe('solo-0')
    expect(rideSummary([rider(1, 'seesaw', 1)]).rigs.seesaw).toBe('solo-1')
  })

  it('혼자 앉았을 때는 탄 사람도 멈춘 자세가 된다', () => {
    expect(rideSummary([rider(1, 'seesaw', 1)]).soloSpots.has('seesaw')).toBe(true)
  })

  it('그네와 회전무대는 혼자여도 움직인다', () => {
    expect(rideSummary([rider(1, 'swing', 0)]).rigs.swing).toBe('riding')
    expect(rideSummary([rider(2, 'merry', 0)]).rigs.merry).toBe('riding')
  })

  it('아무도 안 탄 기구는 목록에 없다', () => {
    expect(rideSummary([stander(1)]).rigs).toEqual({})
  })
})

describe('기구에 붙는 클래스', () => {
  it('혼자 탔을 때는 riding 을 붙이지 않는다 — 붙으면 시소가 혼자서도 움직인다', () => {
    expect(rigClass('solo-0')).toBe('pz-prop solo-0')
    expect(rigClass('solo-1')).toBe('pz-prop solo-1')
  })

  it('인원이 차면 riding 만 붙는다', () => {
    expect(rigClass('riding')).toBe('pz-prop riding')
  })

  it('아무도 안 탔으면 아무것도 붙지 않는다', () => {
    expect(rigClass()).toBe('pz-prop')
    expect(rigClass('idle')).toBe('pz-prop')
  })
})
