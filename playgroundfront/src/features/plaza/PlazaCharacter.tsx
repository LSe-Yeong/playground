import type { CSSProperties } from 'react'
import { colorHex } from './colors'
import type { PlazaMemberView } from './types'

interface Props {
  member: PlazaMemberView
  /** 같은 주기로 흔들리면 줄지어 선 것처럼 보여, 사람마다 시작을 조금씩 늦춘다 */
  delay: number
}

/**
 * 광장에 선 사람 하나 (P-2, P-3).
 * 깊이는 y 로 정한다 — 아래에 있을수록 앞이다. 놀이기구도 같은 기준을 쓴다.
 */
export function PlazaCharacter({ member, delay }: Props) {
  const { ride } = member
  const className = [
    'pz-ch',
    member.me ? 'is-me' : '',
    member.walking && !ride ? 'walk' : '',
    ride ? `ride ride-${ride.spot} seat-${ride.seat}` : '',
    ride?.solo ? 'solo' : '',
  ].filter(Boolean).join(' ')

  const style = {
    '--x': `${member.x.toFixed(2)}%`,
    '--y': `${member.y.toFixed(2)}%`,
    '--lean': `${(member.lean ?? 0).toFixed(1)}deg`,
    '--delay': `${delay}s`,
    zIndex: Math.round(member.y * 10),
  } as CSSProperties

  return (
    <div className={className} style={style}>
      <span className={member.bubble ? 'pz-bubble on' : 'pz-bubble'}>{member.bubble}</span>
      <span className={member.emote ? 'pz-emote on' : 'pz-emote'}>{member.emote}</span>
      <span className="pz-shadow" />
      <span className="pz-body" style={{ background: colorHex(member.colorId) }} />
      <span className="pz-name">{member.nickname}</span>
    </div>
  )
}
