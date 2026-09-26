import type { CSSProperties } from 'react'
import { colorHex } from './colors'
import type { PlazaMember } from './plazaReducer'

interface Props {
  member: PlazaMember
  isMe: boolean
  bubble?: string
  emote?: string
  /** 기구가 움직일 인원이 안 찼을 때. 시소는 혼자면 기운 채 멈춘다 (P-14) */
  solo: boolean
  /** 같은 주기로 흔들리면 줄지어 선 것처럼 보여 사람마다 시작을 조금씩 늦춘다 */
  delay: number
  attach: (memberId: number, node: HTMLElement | null) => void
}

/**
 * 광장에 선 사람 하나 (P-2, P-3).
 *
 * 좌표(--x · --y · --lean · z-index)는 여기서 주지 않는다. 초당 60번 바뀌는 값이라
 * PlazaField 가 DOM 에 직접 쓴다. React 는 자기가 넣은 속성만 건드리므로 서로 부딪히지 않는다.
 */
export function PlazaCharacter({ member, isMe, bubble, emote, solo, delay, attach }: Props) {
  const { riding } = member
  const className = [
    'pz-ch',
    isMe ? 'is-me' : '',
    member.walking && !riding ? 'walk' : '',
    riding ? `ride ride-${riding.spot} seat-${riding.seat}` : '',
    riding && solo ? 'solo' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      style={{ '--delay': `${delay}s` } as CSSProperties}
      ref={(node) => attach(member.id, node)}
    >
      <span className={bubble ? 'pz-bubble on' : 'pz-bubble'}>{bubble}</span>
      <span className={emote ? 'pz-emote on' : 'pz-emote'}>{emote}</span>
      <span className="pz-shadow" />
      <span className="pz-body" style={{ background: colorHex(member.color) }} />
      <span className="pz-name">{member.nickname}</span>
    </div>
  )
}

