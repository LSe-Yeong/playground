import { useRef, useState } from 'react'
import { ProfileChip } from '../../components/ProfileChip'
import type { Profile } from '../../profile'
import { GAMES } from './games'
import { PlazaCardArt } from './PlazaCardArt'
import './hub.css'

interface Props {
  active: boolean
  profile: Profile
  /** 놀이터 카드에 띄울 현재 인원 (P-4). 서버가 붙으면 GET /games 의 liveCount 다 */
  plazaCount: number
  plazaCapacity: number
  onEnter: (gameId: string) => void
  onEditNickname: () => void
  onEditAvatar: () => void
}

/** 카드 고르는 첫 화면 (0-6, 0-9). */
export function HubScreen({
  active, profile, plazaCount, plazaCapacity, onEnter, onEditNickname, onEditAvatar,
}: Props) {
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
    const clamped = Math.max(0, Math.min(GAMES.length - 1, next))
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
        <ProfileChip
          profile={profile}
          onEditNickname={onEditNickname}
          onEditAvatar={onEditAvatar}
        />
      </header>

      <div className="pg-body">
        <div className="track" ref={trackRef} onScroll={syncIndex}>
          {GAMES.map((game) => (
            <article key={game.id} className={game.ready ? 'gcard' : 'gcard soon'}>
              <div
                className={game.imageUrl || game.id === 'plaza' ? 'gcard-art has-art' : 'gcard-art'}
                style={{ background: game.tone }}
              >
                {game.id === 'plaza' ? (
                  <PlazaCardArt />
                ) : game.imageUrl ? (
                  <img src={game.imageUrl} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span className="gcard-icon">{game.icon}</span>
                )}
              </div>
              <div className="gcard-body">
                <div className="gcard-title">
                  <b>{game.name}</b>
                  <span className="gcard-en">{game.nameEn}</span>
                  {game.badge ? (
                    <span className="badge live">{game.badge}</span>
                  ) : game.ready ? (
                    <span className="badge live">플레이 가능</span>
                  ) : (
                    <span className="badge">준비 중</span>
                  )}
                </div>
                <p className="gcard-desc">{game.description}</p>
                {game.tags?.length ? (
                  <div className="gcard-tags">
                    {game.tags.map((tag) => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                ) : null}
                <div className="gcard-meta">
                  <span>
                    👥 {game.id === 'plaza' ? `${plazaCount} / ${plazaCapacity}명` : game.players}
                  </span>
                  <span>⏱ {game.time}</span>
                </div>
                <button
                  type="button"
                  className={game.ready ? 'btn primary big' : 'btn big'}
                  disabled={!game.ready}
                  onClick={() => onEnter(game.id)}
                >
                  {game.cta ?? (game.ready ? '플레이' : '준비 중')}
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="pg-ctrl">
          <button type="button" className="btn icon" title="이전 게임" onClick={() => goTo(index - 1)}>
            ‹
          </button>
          <div className="dots">
            {GAMES.map((game, i) => (
              <button
                key={game.id}
                type="button"
                className={i === index ? 'dot on' : 'dot'}
                title={game.name}
                aria-label={game.name}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button type="button" className="btn icon" title="다음 게임" onClick={() => goTo(index + 1)}>
            ›
          </button>
        </div>
      </div>
    </section>
  )
}
