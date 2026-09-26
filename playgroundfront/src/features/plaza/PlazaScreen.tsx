import type { CSSProperties } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useConnection } from '../../app/connectionContext'
import { ProfileChip } from '../../components/ProfileChip'
import { colorHex } from './colors'
import { PZ_EMOTES, findSpot, timeOfDay } from './constants'
import { ColorOverlay } from './ColorOverlay'
import { DjOverlay } from './DjOverlay'
import { PlazaCharacter } from './PlazaCharacter'
import { rideSummary } from './rides'
import { PlazaChat } from './PlazaChat'
import { PlazaClock } from './PlazaClock'
import { PlazaPlayer } from './PlazaPlayer'
import { PlazaProps } from './PlazaProps'
import { PlazaScene } from './PlazaScene'
import type { Direction } from './PlazaField'
import { usePlaza } from './usePlaza'
import './plaza.css'

interface Props {
  active: boolean
  onLeave: () => void
  onEditNickname: () => void
  onEditAvatar: () => void
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
  A: 'left', D: 'right', W: 'up', S: 'down',
}

/** 낮·밤은 정시에만 바뀌므로 자주 볼 필요가 없다 */
const TOD_INTERVAL_MS = 30_000

export function PlazaScreen({ active, onLeave, onEditNickname, onEditAvatar }: Props) {
  const { profile } = useConnection()
  const { state, near, field, actions, serverNow } = usePlaza(active, onLeave)
  const [overlay, setOverlay] = useState<'dj' | 'color' | null>(null)
  const [tod, setTod] = useState(() => timeOfDay(new Date().getHours()))
  const chatInput = useRef<HTMLInputElement>(null)

  const leave = () => {
    setOverlay(null)
    onLeave()
  }

  const me = state.members.find((member) => member.id === state.meId)
  const { rigs, soloSpots } = rideSummary(state.members)
  const cueSpot = me?.riding ? findSpot(me.riding.spot) : findSpot(near)
  const cueLabel = me?.riding ? '내리기' : cueSpot?.label

  useEffect(() => {
    const timer = window.setInterval(() => setTod(timeOfDay(new Date().getHours())), TOD_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [])

  /* ---------- 키 입력 ---------- */
  const stateRef = useRef({ near, riding: false, overlay })
  useEffect(() => {
    stateRef.current = { near, riding: !!me?.riding, overlay }
  })

  useEffect(() => {
    if (!active) return

    const onKeyDown = (event: KeyboardEvent) => {
      /* 입력칸에서 난 키는 여기서 처리하지 않는다. activeElement 대신 target 을 보는 이유:
         보내면서 포커스를 빼면 버블링이 올라올 때 activeElement 가 이미 바뀌어 Enter 가 다시 잡힌다 */
      if (event.target === chatInput.current) return

      const current = stateRef.current
      if (current.overlay) {
        if (event.key === 'Escape') {
          setOverlay(null)
          event.preventDefault()
        }
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        if (current.riding) actions.dismount()
        else if (current.near === 'dj') setOverlay('dj')
        else if (current.near) actions.ride(current.near)
        return
      }

      if (PZ_EMOTES[Number(event.key)]) {
        event.preventDefault()
        actions.emote(Number(event.key))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        field.clearKeys() /* 누르고 있던 방향키를 놓은 것으로 친다 */
        chatInput.current?.focus()
        return
      }

      const direction = KEY_TO_DIRECTION[event.key]
      if (direction) {
        field.setKey(direction, true)
        event.preventDefault()
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const direction = KEY_TO_DIRECTION[event.key]
      if (direction) field.setKey(direction, false)
    }
    /* 창에서 포커스가 나가면 keyup 이 오지 않아 계속 걷는 것처럼 된다 */
    const onBlur = () => field.clearKeys()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      field.clearKeys()
    }
  }, [active, actions, field])

  const attach = useCallback(
    (memberId: number, node: HTMLElement | null) => field.attach(memberId, node),
    [field],
  )

  return (
    <section className={active ? 'screen active' : 'screen'} id="screen-plaza" data-tod={tod}>
      <header className="topbar">
        <button type="button" className="btn icon" title="나가기" onClick={leave}>←</button>
        <button type="button" className="btn icon pz-color-btn" title="캐릭터 색"
                disabled={!me} onClick={() => setOverlay('color')}>
          <i style={{ background: colorHex(me?.color ?? 'red') }} />
        </button>
        <div className="pz-head">
          <b>놀이터</b>
          <span className="pz-count">{state.members.length} / {state.capacity}명</span>
        </div>
        <ProfileChip profile={profile} onEditNickname={onEditNickname} onEditAvatar={onEditAvatar} />
      </header>

      <div className="pz-wrap">
        <div className="pz-stage">
          <PlazaScene />

          <div className="pz-field">
            {cueSpot && (
              <div className="pz-cue"
                   style={{ '--x': `${cueSpot.x}%`, '--y': `${cueSpot.cy}%` } as CSSProperties}>
                <b>Space</b> <span>{cueLabel}</span>
              </div>
            )}

            <PlazaProps nowPlaying={state.music?.title ?? null} rides={rigs} />

            {state.members.map((member, index) => (
              <PlazaCharacter
                key={member.id}
                member={member}
                isMe={member.id === state.meId}
                bubble={state.bubbles[member.id]}
                emote={state.emotes[member.id]}
                solo={!!member.riding && soloSpots.has(member.riding.spot)}
                delay={(index % 4) * 0.35}
                attach={attach}
              />
            ))}
          </div>

          <div className="pz-tint" aria-hidden="true" />
          <PlazaClock />
          <PlazaPlayer music={state.music} serverNow={serverNow} />
        </div>

        <PlazaChat lines={state.chat} inputRef={chatInput} onSend={actions.chat} />
      </div>

      {overlay === 'dj' && (
        <DjOverlay
          tracks={state.tracks}
          current={state.music}
          onPick={(trackId) => { actions.pickTrack(trackId); setOverlay(null) }}
          onStop={() => { actions.stopMusic(); setOverlay(null) }}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'color' && me && (
        <ColorOverlay
          colors={state.colors}
          current={me.color}
          taken={state.members.filter((m) => m.id !== me.id).map((m) => m.color)}
          onPick={(color) => { actions.changeColor(color); setOverlay(null) }}
          onClose={() => setOverlay(null)}
        />
      )}
    </section>
  )
}
