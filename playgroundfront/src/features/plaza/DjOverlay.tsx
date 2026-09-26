import type { PlazaMusicResponse, PlazaTrackResponse } from '../../api/types'
import { Overlay } from '../../components/Overlay'

interface Props {
  tracks: PlazaTrackResponse[]
  current: PlazaMusicResponse | null
  onPick: (trackId: number) => void
  onStop: () => void
  onClose: () => void
}

/** DJ 부스에서 여는 곡 목록 (P-15). 누구나 고를 수 있고 고르면 즉시 바뀐다. */
export function DjOverlay({ tracks, current, onPick, onStop, onClose }: Props) {
  return (
    <Overlay title="DJ 부스" onClose={onClose}>
      <p className="dj-now">지금 나오는 곡 — {current ? current.title : '없음'}</p>
      <div className="dj-list">
        {tracks.map((track) => (
          <button
            key={track.trackId}
            type="button"
            className={current?.trackId === track.trackId ? 'dj-track on' : 'dj-track'}
            onClick={() => onPick(track.trackId)}
          >
            <b>{track.title}</b>
            <span>{track.mood}</span>
          </button>
        ))}
      </div>
      <button type="button" className="btn ghost big" onClick={onStop}>음악 끄기</button>
    </Overlay>
  )
}
