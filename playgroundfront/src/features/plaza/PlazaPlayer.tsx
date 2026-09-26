import { useEffect, useReducer, useState, type CSSProperties } from 'react'
import type { PlazaMusicResponse } from '../../api/types'
import { loadNumber, save } from '../../app/storage'
import { mmss, volumeIcon } from './constants'
import { PlazaAudio, elapsedSeconds } from './music'

interface Props {
  music: PlazaMusicResponse | null
  /** 서버 시각 추정치. 모두가 같은 지점을 들어야 하므로 내 시계를 쓰지 않는다 */
  serverNow: () => number
}

const VOLUME_KEY = 'plazaVolume'

/**
 * 하늘 왼쪽 위에 떠 있는 진행바 (P-16 ~ P-19)이자 음원을 실제로 트는 곳.
 *
 * 서버는 startedAt 만 준다. 여기서 매초 "지금 − startedAt" 을 다시 구해 진행바를 그리고,
 * 오디오가 그 위치에서 벗어나 있으면 맞춘다. 남은 초를 들고 세면 탭이 멈췄다 돌아왔을 때 어긋난다.
 */
export function PlazaPlayer({ music, serverNow }: Props) {
  const [volume, setVolume] = useState(() => loadNumber(VOLUME_KEY, 70, 0, 100))
  const [audio] = useState(() => new PlazaAudio())
  /* 진행바를 1초에 한 번 다시 그리기만 하면 된다. 위치는 그때그때 다시 구한다 */
  const [, retick] = useReducer((count: number) => count + 1, 0)

  useEffect(() => () => audio.stop(), [audio])

  useEffect(() => {
    audio.setVolume(volume)
  }, [audio, volume])

  useEffect(() => {
    if (!music) {
      audio.stop()
      return
    }
    audio.sync(music, elapsedSeconds(music, serverNow()))
    const timer = window.setInterval(() => {
      retick()
      audio.sync(music, elapsedSeconds(music, serverNow()))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [audio, music, serverNow])

  if (!music) return null

  const elapsed = elapsedSeconds(music, serverNow())
  const ratio = Math.min(1, elapsed / music.durationSec)

  return (
    <div className="pz-player">
      <div className="pz-player-top">
        <b>{music.title}</b>
        <span>{music.mood}</span>
      </div>
      <div className="pz-player-bar">
        <i style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
      </div>
      <div className="pz-player-time">
        <span>{mmss(elapsed)}</span>
        <span>{mmss(music.durationSec)}</span>
      </div>
      <div className="pz-vol">
        <span>{volumeIcon(volume)}</span>
        <input
          type="range"
          id="pz-vol-range"
          min={0}
          max={100}
          step={1}
          aria-label="볼륨"
          value={volume}
          style={{ '--fill': `${volume}%` } as CSSProperties}
          onChange={(event) => {
            const next = Number(event.target.value)
            setVolume(next)
            save(VOLUME_KEY, String(next))
          }}
        />
      </div>
    </div>
  )
}
