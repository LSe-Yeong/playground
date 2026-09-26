import { findSpot } from './constants'
import type { PlazaMember } from './plazaReducer'
import type { RideState } from './PlazaProps'
import type { RideSpot } from './types'

/**
 * 기구마다 몇 명이 탔는지 세어 기구와 사람의 움직임을 정한다 (P-14).
 * 시소는 둘이 앉아야 움직이고, 혼자면 그쪽으로 기운 채 멈춘다.
 */
export function rideSummary(members: PlazaMember[]) {
  const riders = new Map<string, number[]>()
  for (const member of members) {
    if (!member.riding) continue
    const seats = riders.get(member.riding.spot) ?? []
    seats.push(member.riding.seat)
    riders.set(member.riding.spot, seats)
  }

  const rigs: Partial<Record<RideSpot, RideState>> = {}
  const soloSpots = new Set<string>()
  for (const [spotId, seats] of riders) {
    const spot = findSpot(spotId)
    if (!spot) continue
    if (seats.length >= spot.needs) {
      rigs[spotId as RideSpot] = 'riding'
      continue
    }
    soloSpots.add(spotId)
    rigs[spotId as RideSpot] = seats[0] === 0 ? 'solo-0' : 'solo-1'
  }
  return { rigs, soloSpots }
}
