import { findSpot } from './constants'
import type { PlazaMember } from './plazaReducer'
import type { RideSpot, RideState } from './types'

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

/**
 * riding 과 solo 는 함께 붙이지 않는다. riding 은 기구를 계속 움직이게 하고
 * solo 는 그 자리에 기운 채 멈추게 하는데, 둘 다 있으면 riding 이 이겨
 * 혼자 탄 시소가 움직인다 (P-14).
 */
export const rigClass = (ride: RideState = 'idle') =>
  ride === 'idle' ? 'pz-prop' : `pz-prop ${ride}`
