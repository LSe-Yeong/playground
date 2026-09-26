import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ApiError } from '../../api/client'
import { enterPlaza } from '../../api/plaza'
import type {
  PlazaChatResponse, PlazaMemberResponse, PlazaMusicResponse, PlazaStateResponse,
} from '../../api/types'
import { useConnection } from '../../app/connectionContext'
import { useToast } from '../../app/toastContext'
import type { SocketEvent } from '../../socket/types'
import { PZ_BUBBLE_MS, PZ_EMOTE_MS, PZ_EMOTES } from './constants'
import { PlazaField } from './PlazaField'
import { initialPlazaState, plazaReducer, type PlazaAction } from './plazaReducer'
import type { RideSpot } from './types'

interface MovesPayload {
  members: { id: number; x: number; y: number; dir: number }[]
}

/**
 * 광장 하나의 삶 전체 — 입장, 소켓 이벤트 반영, 나가기.
 *
 * 좌표만 PlazaField 가 따로 맡는다. 나머지는 리듀서를 거쳐 React 상태가 된다.
 */
export function usePlaza(active: boolean, onEnterFailed: () => void) {
  const { status, generation, send, subscribe, serverNow } = useConnection()
  const toast = useToast()
  const [state, dispatch] = useReducer(plazaReducer, initialPlazaState)
  const [near, setNear] = useState<string | null>(null)

  const sendRef = useRef(send)
  /* 입장 효과가 이 콜백 때문에 다시 돌면 안 된다. 다시 돌면 나갔다 들어오게 되고,
     퇴장(소켓)보다 입장(HTTP)이 먼저 닿아 ALREADY_IN_ROOM 으로 튕긴다 */
  const enterFailedRef = useRef(onEnterFailed)
  const joinedRef = useRef(false)
  /* 이동이 거절됐을 때 되돌릴 자리. 거절 직전에 서버가 마지막 좌표를 먼저 보낸다 */
  const myLastKnown = useRef<{ x: number; y: number } | null>(null)
  const timers = useRef(new Map<string, number>())

  const field = useMemo(
    () =>
      new PlazaField({
        onNear: setNear,
        onWalking: (walking) => dispatch({ type: 'member.walking', walking }),
      }),
    [],
  )

  useEffect(() => field.setSender(send), [field, send])

  const later = useCallback((key: string, ms: number, run: () => void) => {
    window.clearTimeout(timers.current.get(key))
    timers.current.set(key, window.setTimeout(run, ms))
  }, [])

  /* ---------- 소켓 이벤트 ---------- */
  const handlerRef = useRef<(event: SocketEvent) => void>(() => {})
  const handleEvent = (event: SocketEvent) => {
    switch (event.type) {
      case 'plaza.state': {
        const payload = event.payload as PlazaStateResponse
        dispatch({ type: 'entered', state: payload })
        field.reset(payload.members.map(toMemberShape), payload.meId)
        break
      }
      case 'plaza.moves': {
        const payload = event.payload as MovesPayload
        field.applyMoves(payload.members)
        const mine = payload.members.find((member) => member.id === state.meId)
        if (mine) myLastKnown.current = { x: mine.x, y: mine.y }
        break
      }
      case 'plaza.joined': {
        const member = event.payload as PlazaMemberResponse
        dispatch({ type: 'member.joined', member })
        field.add(toMemberShape(member))
        break
      }
      case 'plaza.left': {
        const { memberId } = event.payload as { memberId: number }
        dispatch({ type: 'member.left', memberId })
        field.remove(memberId)
        break
      }
      case 'plaza.emote': {
        const { memberId, slot } = event.payload as { memberId: number; slot: number }
        const mark = PZ_EMOTES[slot]
        if (!mark) break
        dispatch({ type: 'emote.show', memberId, mark })
        later(`emote:${memberId}`, PZ_EMOTE_MS, () => dispatch({ type: 'emote.hide', memberId }))
        break
      }
      case 'plaza.ride': {
        const { memberId, spot, seat } = event.payload as
          { memberId: number; spot: RideSpot; seat: number }
        dispatch({ type: 'member.ride', memberId, spot, seat })
        field.setRiding(memberId, spot, seat)
        break
      }
      case 'plaza.dismount': {
        const { memberId, x, y } = event.payload as
          { memberId: number; spot: string; x: number; y: number }
        dispatch({ type: 'member.dismount', memberId })
        field.setStanding(memberId, x, y)
        break
      }
      case 'plaza.profile': {
        const { memberId, nickname, avatar } = event.payload as
          { memberId: number; nickname: string; avatar: string }
        dispatch({ type: 'member.profile', memberId, nickname, avatar })
        break
      }
      case 'plaza.color': {
        const { memberId, color } = event.payload as { memberId: number; color: string }
        dispatch({ type: 'member.color', memberId, color })
        break
      }
      case 'plaza.chat': {
        const message = event.payload as PlazaChatResponse
        dispatch({ type: 'chat', message })
        later(`bubble:${message.playerId}`, PZ_BUBBLE_MS, () =>
          dispatch({ type: 'bubble.hide', memberId: message.playerId }))
        break
      }
      case 'plaza.chatReset':
        dispatch({ type: 'chat.reset' })
        break
      case 'plaza.music':
        dispatch({ type: 'music', music: event.payload as PlazaMusicResponse | null })
        break
      case 'error': {
        const { code, message } = event.payload as { code: string; message: string }
        /* 거절당한 이동은 서버가 아는 자리로 되돌린다 — 아니면 어디로 갈지 모른다 */
        if (code === 'OUT_OF_BOUNDS' && myLastKnown.current) {
          field.snapMe(myLastKnown.current.x, myLastKnown.current.y)
        }
        toast(message, 'bad')
        break
      }
      default:
        break
    }
  }

  /* 소켓 이벤트는 커밋 뒤에 오므로, 최신 처리기를 효과에서 갈아 끼워도 늦지 않다.
     렌더 중에 ref 를 쓰면 버려진 렌더의 값이 남을 수 있다 */
  useEffect(() => {
    handlerRef.current = handleEvent
    sendRef.current = send
    enterFailedRef.current = onEnterFailed
  })

  useEffect(() => subscribe((event) => handlerRef.current(event)), [subscribe])

  /* ---------- 입장과 퇴장 ---------- */
  useEffect(() => {
    if (!active || status !== 'ready') return
    let cancelled = false

    enterPlaza()
      .then((entered) => {
        if (cancelled) return
        joinedRef.current = true
        dispatch({ type: 'entered', state: entered })
        field.reset(entered.members.map(toMemberShape), entered.meId)
        field.start()
      })
      .catch((error) => {
        if (cancelled) return
        toast(error instanceof ApiError ? error.message : '놀이터에 들어가지 못했습니다', 'bad')
        enterFailedRef.current()
      })

    return () => {
      cancelled = true
      field.stop()
      if (joinedRef.current) {
        joinedRef.current = false
        sendRef.current('plaza.leave')
      }
      dispatch({ type: 'left' })
    }
    /* generation 이 오르면 소켓이 새로 붙은 것이라 다시 입장해야 한다.
       그 밖의 값으로는 다시 돌지 않는다 */
  }, [active, status, generation, field, toast])

  useEffect(() => {
    const running = timers.current
    return () => {
      for (const id of running.values()) window.clearTimeout(id)
      running.clear()
    }
  }, [])

  const actions = useMemo(
    () => ({
      ride: (spot: string) => send('plaza.ride', { spot }),
      dismount: () => send('plaza.dismount'),
      emote: (slot: number) => send('plaza.emote', { slot }),
      chat: (body: string) => send('plaza.chat', { body }),
      changeColor: (color: string) => send('plaza.color', { color }),
      pickTrack: (trackId: number) => send('plaza.music.pick', { trackId }),
      stopMusic: () => send('plaza.music.stop'),
    }),
    [send],
  )

  return { state, near, field, actions, serverNow }
}

/** 리듀서가 쓰는 모양으로 맞춘다. 좌표는 PlazaField 가 첫 자리로만 쓴다 */
const toMemberShape = (member: PlazaMemberResponse) => ({
  id: member.id,
  nickname: member.nickname,
  avatar: member.avatar,
  color: member.color,
  riding: member.riding
    ? { spot: member.riding.spot as RideSpot, seat: member.riding.seat }
    : null,
  spawn: { x: member.x, y: member.y, dir: member.dir },
  walking: false,
})

export type PlazaActions = ReturnType<typeof usePlaza>['actions']
export type { PlazaAction }
