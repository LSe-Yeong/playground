import { describe, expect, it } from 'vitest'
import type { PlazaMusicResponse } from '../../api/types'
import { elapsedSeconds } from './music'

const STARTED_AT = '2026-09-26T10:00:00Z'
const started = new Date(STARTED_AT).getTime()

const music: PlazaMusicResponse = {
  trackId: 2, title: '잔잔한 오후', mood: 'Calm',
  srcUrl: 'http://localhost:8080/pg/api/audio/02_calm_inst.mp3',
  durationSec: 132, startedAt: STARTED_AT,
}

describe('재생 위치', () => {
  it('시작 시각과 지금의 차이로 구한다 — 늦게 들어와도 같은 지점을 듣는다', () => {
    expect(elapsedSeconds(music, started + 37_000)).toBe(37)
  })

  it('곡 길이를 넘지 않는다 — 서버가 다음 곡을 보내기 직전까지 진행바가 꽉 찬 채 있는다', () => {
    expect(elapsedSeconds(music, started + 500_000)).toBe(132)
  })

  it('시계가 서버보다 앞서 있어도 음수가 되지 않는다', () => {
    expect(elapsedSeconds(music, started - 5_000)).toBe(0)
  })
})
