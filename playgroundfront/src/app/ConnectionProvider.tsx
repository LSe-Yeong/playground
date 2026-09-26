import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../api/client'
import { issueSession, updateMyProfile } from '../api/sessions'
import { PlaygroundSocket, SocketClosedError } from '../socket/PlaygroundSocket'
import { CLOSE_ALREADY_CONNECTED, type SocketListener } from '../socket/types'
import { randomNickname, type Profile } from '../profile'
import {
  ConnectionContext, type ConnectionStatus, type ConnectionValue,
} from './connectionContext'
import { load, save } from './storage'
import { useToast } from './toastContext'

const PROFILE_KEY = 'profile'
const RETRY_MAX_MS = 10_000

function loadProfile(): Profile {
  return load(
    PROFILE_KEY,
    (raw) => {
      const parsed = JSON.parse(raw) as Partial<Profile>
      return parsed.nickname && parsed.avatar
        ? { nickname: parsed.nickname, avatar: parsed.avatar }
        : null
    },
    { nickname: randomNickname(), avatar: '⛏' },
  )
}

/**
 * 세션 하나와 소켓 하나를 앱이 사는 동안 유지한다.
 *
 * 소켓이 끊기면 서버가 세션을 지운다(0-4). 재접속 복구가 없으므로 다시 붙을 때는
 * 세션부터 새로 받아야 하고, 그래서 재연결 판단을 소켓이 아니라 여기서 한다.
 */
export function ConnectionProvider({ children }: { children: ReactNode }) {
  const toast = useToast()
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [generation, setGeneration] = useState(0)
  const [profile, setProfile] = useState<Profile>(loadProfile)

  const [socket] = useState(() => new PlaygroundSocket())

  const profileRef = useRef(profile)
  const offsetRef = useRef<number | null>(null)
  const retryRef = useRef(0)
  const startedRef = useRef(false)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  /* 이벤트마다 서버 시각이 실려 온다. 튀는 값을 그대로 쓰면 진행바가 들썩여 조금씩 당긴다 */
  const observeServerTime = useCallback((at: string) => {
    const sample = new Date(at).getTime() - Date.now()
    if (!Number.isFinite(sample)) return
    offsetRef.current =
      offsetRef.current === null ? sample : offsetRef.current * 0.8 + sample * 0.2
  }, [])

  useEffect(() => {
    /* 연결은 앱이 사는 동안 하나뿐이다. StrictMode 가 효과를 두 번 돌려도 한 번만 시작하고,
       정리 단계에서 끊지 않는다 — 끊었다 다시 붙으면 서버가 같은 세션의 두 번째 연결로 보고
       4409 로 막는다. 탭을 닫을 때는 브라우저가 알아서 닫아 준다 */
    if (startedRef.current) return
    startedRef.current = true

    const connect = async () => {
      setStatus('connecting')
      try {
        const session = await issueSession(profileRef.current.nickname, profileRef.current.avatar)
        setProfile({ nickname: session.nickname, avatar: session.avatar })
        await socket.connect()
        retryRef.current = 0
        setStatus('ready')
        setGeneration((value) => value + 1)
      } catch (error) {
        if (error instanceof SocketClosedError && error.code === CLOSE_ALREADY_CONNECTED) {
          blocked()
          return
        }
        retry()
      }
    }

    const blocked = () => {
      setStatus('blocked')
      toast('다른 탭에서 이미 열려 있습니다', 'bad')
    }

    const retry = () => {
      const wait = Math.min(1000 * 2 ** retryRef.current, RETRY_MAX_MS)
      retryRef.current += 1
      setStatus('connecting')
      window.setTimeout(() => void connect(), wait)
    }

    socket.onClose((code) => {
      if (code === CLOSE_ALREADY_CONNECTED) {
        blocked()
        return
      }
      /* 끊기면 서버가 세션을 지운다. 세션부터 다시 받아야 하므로 connect 를 통째로 다시 탄다 */
      toast('연결이 끊어져 다시 잇는 중입니다', 'bad')
      retry()
    })

    void connect()
  }, [socket, toast])

  const subscribe = useCallback(
    (listener: SocketListener) =>
      socket.subscribe((event) => {
        observeServerTime(event.at)
        listener(event)
      }),
    [socket, observeServerTime],
  )

  const saveProfile = useCallback(
    async (next: Partial<Profile>) => {
      const merged = { ...profileRef.current, ...next }
      try {
        const updated = await updateMyProfile(next)
        setProfile({ nickname: updated.nickname, avatar: updated.avatar })
        save(PROFILE_KEY, JSON.stringify({ nickname: updated.nickname, avatar: updated.avatar }))
      } catch (error) {
        /* 세션이 없으면 다음 연결 때 이 값으로 다시 만들어진다 */
        setProfile(merged)
        save(PROFILE_KEY, JSON.stringify(merged))
        if (error instanceof ApiError) toast(error.message, 'bad')
      }
    },
    [toast],
  )

  const value = useMemo<ConnectionValue>(
    () => ({
      status,
      generation,
      profile,
      saveProfile,
      send: (type, payload) => socket.send(type, payload),
      subscribe,
      serverNow: () => Date.now() + (offsetRef.current ?? 0),
    }),
    [status, generation, profile, saveProfile, socket, subscribe],
  )

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
}
