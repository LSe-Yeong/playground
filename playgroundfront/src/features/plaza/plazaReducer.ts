import type {
  PlazaChatResponse, PlazaMemberResponse, PlazaMusicResponse, PlazaStateResponse,
  PlazaTrackResponse,
} from '../../api/types'
import { colorHex } from './colors'
import { PZ_CAPACITY, PZ_CHAT_KEEP, PZ_CHAT_RESET_MIN } from './constants'
import type { PlazaChatLine, RideSpot } from './types'

export interface PlazaMember {
  id: number
  nickname: string
  avatar: string
  color: string
  riding: { spot: RideSpot; seat: number } | null
  /** 이 사람이 나타난 시점의 자리. 그 뒤 실제 위치는 PlazaField 가 들고 있다 */
  spawn: { x: number; y: number; dir: number }
  /** 걷는 중인지. 자주 바뀌지 않아 상태에 둔다 (좌표와 달리 프레임마다 바뀌지 않는다) */
  walking: boolean
}

export interface PlazaState {
  joined: boolean
  meId: number | null
  capacity: number
  members: PlazaMember[]
  chat: PlazaChatLine[]
  music: PlazaMusicResponse | null
  tracks: PlazaTrackResponse[]
  chatResetAt: string | null
  colors: string[]
  /** 머리 위에 잠깐 떴다 사라지는 것들 */
  bubbles: Record<number, string>
  emotes: Record<number, string>
}

export const initialPlazaState: PlazaState = {
  joined: false,
  meId: null,
  capacity: PZ_CAPACITY,
  members: [],
  chat: [],
  music: null,
  tracks: [],
  chatResetAt: null,
  colors: [],
  bubbles: {},
  emotes: {},
}

export type PlazaAction =
  | { type: 'entered'; state: PlazaStateResponse }
  | { type: 'left' }
  | { type: 'member.joined'; member: PlazaMemberResponse }
  | { type: 'member.left'; memberId: number }
  | { type: 'member.profile'; memberId: number; nickname: string; avatar: string }
  | { type: 'member.color'; memberId: number; color: string }
  | { type: 'member.ride'; memberId: number; spot: RideSpot; seat: number }
  | { type: 'member.dismount'; memberId: number }
  | { type: 'member.walking'; walking: Record<number, boolean> }
  | { type: 'chat'; message: PlazaChatResponse }
  | { type: 'chat.reset' }
  | { type: 'music'; music: PlazaMusicResponse | null }
  | { type: 'bubble.hide'; memberId: number }
  | { type: 'emote.show'; memberId: number; mark: string }
  | { type: 'emote.hide'; memberId: number }

const toMember = (member: PlazaMemberResponse): PlazaMember => ({
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

const toChatLine = (message: PlazaChatResponse, meId: number | null): PlazaChatLine => ({
  id: message.id,
  me: message.playerId === meId,
  nickname: message.nickname,
  avatar: message.avatar,
  /* 서버는 색 코드만 준다. 실제 색값은 화면이 안다 (P-24) */
  colorHex: colorHex(message.color),
  body: message.body,
})

const keepRecent = (chat: PlazaChatLine[]) =>
  chat.length > PZ_CHAT_KEEP ? chat.slice(-PZ_CHAT_KEEP) : chat

const patchMember = (
  state: PlazaState,
  memberId: number,
  change: (member: PlazaMember) => PlazaMember,
) => ({
  ...state,
  members: state.members.map((member) => (member.id === memberId ? change(member) : member)),
})

const without = (record: Record<number, string>, memberId: number) => {
  if (!(memberId in record)) return record
  const next = { ...record }
  delete next[memberId]
  return next
}

/**
 * 소켓 이벤트를 광장 상태로 옮긴다.
 *
 * 좌표(plaza.moves)는 여기로 오지 않는다. 20명이 걸으면 초당 수십 번 바뀌는데
 * 그때마다 React 가 다시 그리면 감당이 안 된다. 좌표만 PlazaField 가 따로 들고
 * DOM 에 바로 쓴다.
 */
export function plazaReducer(state: PlazaState, action: PlazaAction): PlazaState {
  switch (action.type) {
    case 'entered': {
      const entered = action.state
      return {
        joined: true,
        meId: entered.meId,
        capacity: entered.capacity,
        members: entered.members.map(toMember),
        chat: entered.chat.map((message) => toChatLine(message, entered.meId)),
        music: entered.music,
        tracks: entered.tracks,
        chatResetAt: entered.chatResetAt,
        colors: entered.colors,
        bubbles: {},
        emotes: {},
      }
    }

    case 'left':
      return initialPlazaState

    case 'member.joined':
      return state.members.some((member) => member.id === action.member.id)
        ? state
        : { ...state, members: [...state.members, toMember(action.member)] }

    case 'member.left':
      return {
        ...state,
        members: state.members.filter((member) => member.id !== action.memberId),
        bubbles: without(state.bubbles, action.memberId),
        emotes: without(state.emotes, action.memberId),
      }

    case 'member.profile':
      return patchMember(state, action.memberId, (member) => ({
        ...member,
        nickname: action.nickname,
        avatar: action.avatar,
      }))

    case 'member.color':
      return patchMember(state, action.memberId, (member) => ({ ...member, color: action.color }))

    case 'member.ride':
      return patchMember(state, action.memberId, (member) => ({
        ...member,
        riding: { spot: action.spot, seat: action.seat },
        walking: false,
      }))

    case 'member.dismount':
      return patchMember(state, action.memberId, (member) => ({ ...member, riding: null }))

    case 'member.walking': {
      let changed = false
      const members = state.members.map((member) => {
        const walking = action.walking[member.id]
        if (walking === undefined || walking === member.walking) return member
        changed = true
        return { ...member, walking }
      })
      return changed ? { ...state, members } : state
    }

    case 'chat':
      return {
        ...state,
        chat: keepRecent([...state.chat, toChatLine(action.message, state.meId)]),
        bubbles: { ...state.bubbles, [action.message.playerId]: action.message.body },
      }

    /* 10분 경계마다 전부 비우고 안내 한 줄만 남긴다 (P-23) */
    case 'chat.reset':
      return {
        ...state,
        chat: [{ id: 0, system: true, body: `${PZ_CHAT_RESET_MIN}분마다 대화가 비워집니다` }],
        bubbles: {},
      }

    case 'music':
      return { ...state, music: action.music }

    case 'bubble.hide':
      return { ...state, bubbles: without(state.bubbles, action.memberId) }

    case 'emote.show':
      return { ...state, emotes: { ...state.emotes, [action.memberId]: action.mark } }

    case 'emote.hide':
      return { ...state, emotes: without(state.emotes, action.memberId) }

    default:
      return state
  }
}
