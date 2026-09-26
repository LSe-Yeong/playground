import { useState } from 'react'
import { AvatarOverlay } from './components/AvatarOverlay'
import { BackgroundScene } from './components/BackgroundScene'
import { NicknameOverlay } from './components/NicknameOverlay'
import { HubScreen } from './features/hub/HubScreen'
import { ColorOverlay } from './features/plaza/ColorOverlay'
import { DjOverlay } from './features/plaza/DjOverlay'
import { PZ_CAPACITY } from './features/plaza/constants'
import { PlazaScreen } from './features/plaza/PlazaScreen'
import type { PlazaTrack } from './features/plaza/types'
import {
  MOCK_CHAT, MOCK_ELAPSED_SEC, MOCK_MEMBERS, MOCK_NOW_PLAYING, MOCK_TRACKS,
} from './mock/plaza'
import { randomNickname, type Profile } from './profile'

type ScreenName = 'hub' | 'plaza'
type OverlayName = 'avatar' | 'nickname' | 'dj' | 'color'

/**
 * 화면만 먼저 만든 단계다. 서버 연결·캐릭터 이동·음원 재생은 아직 붙이지 않았고,
 * 화면에 보이는 값은 src/mock 에서 온다.
 */
export default function App() {
  const [screen, setScreen] = useState<ScreenName>('hub')
  const [overlay, setOverlay] = useState<OverlayName | null>(null)
  const [profile, setProfile] = useState<Profile>({ nickname: randomNickname(), avatar: '⛏' })

  const [members, setMembers] = useState(MOCK_MEMBERS)
  const [nowPlaying, setNowPlaying] = useState<PlazaTrack | null>(MOCK_NOW_PLAYING)

  const me = members.find((member) => member.me)
  const takenColors = members.filter((member) => !member.me).map((member) => member.colorId)

  const closeOverlay = () => setOverlay(null)

  return (
    <>
      <BackgroundScene />

      <div id="app">
        <HubScreen
          active={screen === 'hub'}
          profile={profile}
          plazaCount={members.length}
          plazaCapacity={PZ_CAPACITY}
          onEnter={(gameId) => gameId === 'plaza' && setScreen('plaza')}
          onEditNickname={() => setOverlay('nickname')}
          onEditAvatar={() => setOverlay('avatar')}
        />

        <PlazaScreen
          active={screen === 'plaza'}
          profile={profile}
          members={members}
          chat={MOCK_CHAT}
          nowPlaying={nowPlaying}
          elapsedSec={MOCK_ELAPSED_SEC}
          nearSpotId="dj"
          onLeave={() => setScreen('hub')}
          onOpenDj={() => setOverlay('dj')}
          onOpenColor={() => setOverlay('color')}
          onEditNickname={() => setOverlay('nickname')}
          onEditAvatar={() => setOverlay('avatar')}
        />
      </div>

      {overlay === 'avatar' && (
        <AvatarOverlay
          current={profile.avatar}
          onPick={(avatar) => {
            setProfile({ ...profile, avatar })
            closeOverlay()
          }}
          onClose={closeOverlay}
        />
      )}

      {overlay === 'nickname' && (
        <NicknameOverlay
          current={profile.nickname}
          onSave={(nickname) => {
            setProfile({ ...profile, nickname })
            closeOverlay()
          }}
          onClose={closeOverlay}
        />
      )}

      {overlay === 'dj' && (
        <DjOverlay
          tracks={MOCK_TRACKS}
          current={nowPlaying}
          onPick={(trackId) => {
            setNowPlaying(MOCK_TRACKS.find((track) => track.trackId === trackId) ?? null)
            closeOverlay()
          }}
          onStop={() => {
            setNowPlaying(null)
            closeOverlay()
          }}
          onClose={closeOverlay}
        />
      )}

      {overlay === 'color' && me && (
        <ColorOverlay
          current={me.colorId}
          taken={takenColors}
          onPick={(colorId) => {
            setMembers(members.map((m) => (m.me ? { ...m, colorId } : m)))
            closeOverlay()
          }}
          onClose={closeOverlay}
        />
      )}

      <div className="toast-area" />
    </>
  )
}
