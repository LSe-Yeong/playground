import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { ProfileChip } from '../../components/ProfileChip'
import type { Profile } from '../../profile'
import { colorHex } from './colors'
import { PZ_CAPACITY, PZ_FONT_DEFAULT, PZ_SPOTS, timeOfDay } from './constants'
import { PlazaCharacter } from './PlazaCharacter'
import { PlazaChat } from './PlazaChat'
import { PlazaClock } from './PlazaClock'
import { PlazaPlayer } from './PlazaPlayer'
import { PlazaProps } from './PlazaProps'
import { PlazaScene } from './PlazaScene'
import type { PlazaChatLine, PlazaMemberView, PlazaTrack, RideSpot } from './types'
import './plaza.css'

interface Props {
  active: boolean
  profile: Profile
  members: PlazaMemberView[]
  chat: PlazaChatLine[]
  nowPlaying: PlazaTrack | null
  elapsedSec: number
  /** 가까이 간 지점. 있으면 광장 위에 Space 안내가 뜬다 (P-11) */
  nearSpotId?: string | null
  onLeave: () => void
  onOpenDj: () => void
  onOpenColor: () => void
  onEditNickname: () => void
  onEditAvatar: () => void
}

/** 어느 기구에 누가 몇 명 타고 있는지. 시소는 혼자면 그쪽으로 기운 채 멈춘다 (P-14) */
function rideStates(members: PlazaMemberView[]) {
  const riders = new Map<RideSpot, PlazaMemberView[]>()
  for (const member of members) {
    if (!member.ride) continue
    const list = riders.get(member.ride.spot) ?? []
    list.push(member)
    riders.set(member.ride.spot, list)
  }
  const states: Partial<Record<RideSpot, 'idle' | 'riding' | 'solo-0' | 'solo-1'>> = {}
  for (const [spot, list] of riders) {
    states[spot] = spot === 'seesaw' && list.length === 1
      ? (`solo-${list[0].ride!.seat}` as 'solo-0' | 'solo-1')
      : 'riding'
  }
  return states
}

export function PlazaScreen({
  active, profile, members, chat, nowPlaying, elapsedSec, nearSpotId = null,
  onLeave, onOpenDj, onOpenColor, onEditNickname, onEditAvatar,
}: Props) {
  const [now, setNow] = useState(() => new Date())
  const [fontStep, setFontStep] = useState(PZ_FONT_DEFAULT)
  const [volume, setVolume] = useState(70)
  const [draft, setDraft] = useState('')

  /* 시계와 낮·밤은 벽시계를 그대로 따라간다 (P-20, P-21) */
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  /* 가까이 간 지점에서 Space 를 누르면 그 지점의 동작이 열린다 (P-11, P-15) */
  useEffect(() => {
    if (!active || nearSpotId !== 'dj') return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return
      if (event.target instanceof HTMLInputElement) return
      event.preventDefault()
      onOpenDj()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, nearSpotId, onOpenDj])

  const me = members.find((member) => member.me)
  const rides = rideStates(members)
  const nearSpot = PZ_SPOTS.find((spot) => spot.id === nearSpotId)
  const seesawSolo = members.filter((m) => m.ride?.spot === 'seesaw').length === 1

  return (
    <section
      className={active ? 'screen active' : 'screen'}
      id="screen-plaza"
      data-tod={timeOfDay(now.getHours())}
    >
      <header className="topbar">
        <button type="button" className="btn icon" title="나가기" onClick={onLeave}>
          ←
        </button>
        <button
          type="button"
          className="btn icon pz-color-btn"
          title="캐릭터 색"
          onClick={onOpenColor}
        >
          <i style={{ background: colorHex(me?.colorId ?? 'red') }} />
        </button>
        <div className="pz-head">
          <b>놀이터</b>
          <span className="pz-count">{members.length} / {PZ_CAPACITY}명</span>
        </div>
        <ProfileChip
          profile={profile}
          onEditNickname={onEditNickname}
          onEditAvatar={onEditAvatar}
        />
      </header>

      <div className="pz-wrap">
        <div className="pz-stage">
          <PlazaScene />

          <div className="pz-field">
            {nearSpot && (
              <div
                className="pz-cue"
                style={{ '--x': `${nearSpot.x}%`, '--y': `${nearSpot.cy}%` } as CSSProperties}
              >
                <b>Space</b> <span>{nearSpot.label}</span>
              </div>
            )}

            <PlazaProps nowPlaying={nowPlaying?.title ?? null} rides={rides} />

            {members.map((member, i) => (
              <PlazaCharacter
                key={member.id}
                member={
                  member.ride?.spot === 'seesaw'
                    ? { ...member, ride: { ...member.ride, solo: seesawSolo } }
                    : member
                }
                delay={(i % 4) * 0.35}
              />
            ))}
          </div>

          <div className="pz-tint" aria-hidden="true" />
          <PlazaClock now={now} />
          <PlazaPlayer
            track={nowPlaying}
            elapsedSec={elapsedSec}
            volume={volume}
            onVolumeChange={setVolume}
          />
        </div>

        <PlazaChat
          lines={chat}
          fontStep={fontStep}
          onFontStep={setFontStep}
          draft={draft}
          onDraftChange={setDraft}
          onSend={() => setDraft('')}
        />
      </div>
    </section>
  )
}
