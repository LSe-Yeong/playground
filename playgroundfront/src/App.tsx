import { useCallback, useState } from 'react'
import { ConnectionProvider } from './app/ConnectionProvider'
import { useConnection } from './app/connectionContext'
import { ToastProvider } from './app/ToastProvider'
import { useToast } from './app/toastContext'
import { AvatarOverlay } from './components/AvatarOverlay'
import { BackgroundScene } from './components/BackgroundScene'
import { NicknameOverlay } from './components/NicknameOverlay'
import { HubScreen } from './features/hub/HubScreen'
import { PlazaScreen } from './features/plaza/PlazaScreen'

export default function App() {
  return (
    <ToastProvider>
      <ConnectionProvider>
        <Playground />
      </ConnectionProvider>
    </ToastProvider>
  )
}

type ScreenName = 'hub' | 'plaza'
type OverlayName = 'avatar' | 'nickname'

function Playground() {
  const { profile, saveProfile, status } = useConnection()
  const toast = useToast()
  const [screen, setScreen] = useState<ScreenName>('hub')
  const [overlay, setOverlay] = useState<OverlayName | null>(null)

  const editNickname = useCallback(() => setOverlay('nickname'), [])
  const editAvatar = useCallback(() => setOverlay('avatar'), [])
  const backToHub = useCallback(() => setScreen('hub'), [])

  const enter = (gameCode: string) => {
    if (gameCode !== 'plaza') return
    /* 소켓이 붙기 전에 들어가면 광장 안에서 아무것도 주고받지 못한다 */
    if (status !== 'ready') {
      toast(status === 'blocked' ? '다른 탭에서 이미 열려 있습니다' : '연결 중입니다', 'bad')
      return
    }
    setScreen('plaza')
  }

  return (
    <>
      <BackgroundScene />

      <div id="app">
        <HubScreen
          active={screen === 'hub'}
          onEnter={enter}
          onEditNickname={editNickname}
          onEditAvatar={editAvatar}
        />

        <PlazaScreen
          active={screen === 'plaza'}
          onLeave={backToHub}
          onEditNickname={editNickname}
          onEditAvatar={editAvatar}
        />
      </div>

      {overlay === 'avatar' && (
        <AvatarOverlay
          current={profile.avatar}
          onPick={(avatar) => {
            void saveProfile({ avatar })
            setOverlay(null)
          }}
          onClose={() => setOverlay(null)}
        />
      )}

      {overlay === 'nickname' && (
        <NicknameOverlay
          current={profile.nickname}
          onSave={(nickname) => {
            void saveProfile({ nickname })
            setOverlay(null)
          }}
          onClose={() => setOverlay(null)}
        />
      )}
    </>
  )
}
