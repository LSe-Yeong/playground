import { useRef, useState } from 'react'
import type { GameResponse } from '../../api/types'
import { useConnection } from '../../app/connectionContext'
import { ProfileChip } from '../../components/ProfileChip'
import { lookOf } from './games'
import { useGames } from './useGames'
import './hub.css'

interface Props {
  active: boolean
  onEnter: (gameCode: string) => void
  onEditNickname: () => void
  onEditAvatar: () => void
}

/** 인원을 셀 수 있는 카드는 지금 몇 명인지, 아니면 정원을 보여준다 */
function playersLabel(game: GameResponse) {
  if (game.liveCount !== null && game.capacity !== null) {
    return `${game.liveCount} / ${game.capacity}명`
  }
  return game.maxPlayers > 0 ? `${game.minPlayers}~${game.maxPlayers}명` : '—'
}

/** 카드 고르는 첫 화면 (0-6, 0-9). */
export function HubScreen({ active, onEnter, onEditNickname, onEditAvatar }: Props) {
  const { profile } = useConnection()
  const games = useGames(active)
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  /* 카드 한 장이 트랙 폭을 다 차지하므로, 스크롤 위치를 폭으로 나누면 몇 번째인지 나온다 */
  const syncIndex = () => {
    const track = trackRef.current
    if (!track) return
    setIndex(Math.round(track.scrollLeft / track.clientWidth))
  }

  const goTo = (next: number) => {
    const track = trackRef.current
    if (!track) return
    const clamped = Math.max(0, Math.min(games.length - 1, next))
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
    setIndex(clamped)
  }

  return (
    <section className={active ? 'screen active' : 'screen'} id="screen-playground">
      <header className="pg-top">
        <span className="pg-logo">🛝</span>
        <div className="pg-titles">
          <h1>놀이터</h1>
          <p>playground</p>
        </div>
        <ProfileChip profile={profile} onEditNickname={onEditNickname} onEditAvatar={onEditAvatar} />
      </header>

      <div className="pg-body">
        <div className="track" ref={trackRef} onScroll={syncIndex}>
          {games.map((game) => {
            const look = lookOf(game.code)
            return (
              <article key={game.code} className={game.playable ? 'gcard' : 'gcard soon'}>
                <div
                  className={look.imageUrl ? 'gcard-art has-art' : 'gcard-art'}
                  style={{ background: look.tone }}
                >
                  {look.imageUrl ? (
                    <img src={look.imageUrl} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="gcard-icon">{look.icon}</span>
                  )}
                </div>
                <div className="gcard-body">
                  <div className="gcard-title">
                    <b>{game.name}</b>
                    <span className="gcard-en">{game.nameEn}</span>
                    {look.badge ? (
                      <span className="badge live">{look.badge}</span>
                    ) : game.playable ? (
                      <span className="badge live">플레이 가능</span>
                    ) : (
                      <span className="badge">준비 중</span>
                    )}
                  </div>
                  <p className="gcard-desc">{game.description}</p>
                  {game.tags.length > 0 && (
                    <div className="gcard-tags">
                      {game.tags.map((tag) => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="gcard-meta">
                    <span>👥 {playersLabel(game)}</span>
                    <span>⏱ {game.playMinutes ?? '—'}</span>
                  </div>
                  <button
                    type="button"
                    className={game.playable ? 'btn primary big' : 'btn big'}
                    disabled={!game.playable}
                    onClick={() => onEnter(game.code)}
                  >
                    {look.cta ?? (game.playable ? '플레이' : '준비 중')}
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <div className="pg-ctrl">
          <button type="button" className="btn icon" title="이전 게임" onClick={() => goTo(index - 1)}>‹</button>
          <div className="dots">
            {games.map((game, i) => (
              <button
                key={game.code}
                type="button"
                className={i === index ? 'dot on' : 'dot'}
                title={game.name}
                aria-label={game.name}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" className="btn icon" title="다음 게임" onClick={() => goTo(index + 1)}>›</button>
        </div>
      </div>
    </section>
  )
}
