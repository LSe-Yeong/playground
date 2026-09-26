import { useCallback, useEffect, useState } from 'react'
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

/** 히스토리에 남기는 표시. 주소는 바꾸지 않고 항목만 쌓는다 */
interface ScreenHistoryState {
  screen?: ScreenName
}

const historyScreen = () =>
  (window.history.state as ScreenHistoryState | null)?.screen ?? 'hub'

function Playground() {
  const { profile, saveProfile, status } = useConnection()
  const toast = useToast()
  const [screen, setScreen] = useState<ScreenName>('hub')
  const [overlay, setOverlay] = useState<OverlayName | null>(null)

  const editNickname = useCallback(() => setOverlay('nickname'), [])
  const editAvatar = useCallback(() => setOverlay('avatar'), [])

  /**
   * 광장에 들어갈 때 히스토리 항목을 하나 쌓는다. 주소는 `/` 그대로다.
   *
   * 쌓지 않으면 광장에서 뒤로가기를 눌렀을 때 허브가 아니라 앱 밖으로 나간다.
   * 카드를 골라 들어가는 구조라 뒤로가기로 목록에 돌아올 것을 기대하게 된다.
   *
   * 주소까지 `/plaza` 로 바꾸지는 않는다. 새로고침하면 있던 곳에서 나가므로(0-4)
   * 주소만 광장을 가리키고 화면은 허브인 상태가 된다.
   */
  useEffect(() => {
    /* 새로고침으로 돌아왔다면 쌓아 둔 항목이 남아 있다. 화면은 허브에서 시작하므로 지운다 */
    if (historyScreen() === 'plaza') window.history.replaceState(null, '')

    const onPopState = () => setScreen(historyScreen())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  /* 나가기 버튼도 뒤로가기와 같은 길을 타야 항목이 쌓인 채로 남지 않는다 */
  const backToHub = useCallback(() => {
    if (historyScreen() === 'plaza') window.history.back()
    else setScreen('hub')
  }, [])

  const enter = (gameCode: string) => {
    if (gameCode !== 'plaza') return
    /* 소켓이 붙기 전에 들어가면 광장 안에서 아무것도 주고받지 못한다 */
    if (status !== 'ready') {
      toast(status === 'blocked' ? '다른 탭에서 이미 열려 있습니다' : '연결 중입니다', 'bad')
      return
    }
    window.history.pushState({ screen: 'plaza' } satisfies ScreenHistoryState, '')
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
