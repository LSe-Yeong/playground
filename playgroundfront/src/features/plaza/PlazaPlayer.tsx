import type { CSSProperties } from 'react'
import { mmss, volumeIcon } from './constants'
import type { PlazaTrack } from './types'

interface Props {
  track: PlazaTrack | null
  /** 곡이 시작된 뒤 흐른 초 (P-17). 서버는 startedAt 만 주고 이 값은 각자 계산한다 */
  elapsedSec: number
  volume: number
  onVolumeChange: (volume: number) => void
}

/** 하늘 왼쪽 위에 떠 있는 진행바 (P-16 ~ P-19). 꺼져 있으면 아무것도 그리지 않는다. */
export function PlazaPlayer({ track, elapsedSec, volume, onVolumeChange }: Props) {
  if (!track) return null

  const ratio = Math.min(1, elapsedSec / track.durationSec)

  return (
    <div className="pz-player">
      <div className="pz-player-top">
        <b>{track.title}</b>
        <span>{track.mood}</span>
      </div>
      <div className="pz-player-bar">
        <i style={{ width: `${(ratio * 100).toFixed(2)}%` }} />
      </div>
      <div className="pz-player-time">
        <span>{mmss(elapsedSec)}</span>
        <span>{mmss(track.durationSec)}</span>
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
          onChange={(event) => onVolumeChange(Number(event.target.value))}
        />
      </div>
    </div>
  )
}
