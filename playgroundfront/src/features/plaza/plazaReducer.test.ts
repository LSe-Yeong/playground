import { describe, expect, it } from 'vitest'
import type { PlazaMemberResponse, PlazaStateResponse } from '../../api/types'
import { PZ_CHAT_KEEP } from './constants'
import { initialPlazaState, plazaReducer, type PlazaState } from './plazaReducer'

const member = (id: number, over: Partial<PlazaMemberResponse> = {}): PlazaMemberResponse => ({
  id, nickname: `두더지${id}`, avatar: '⛏', color: 'red', x: 50, y: 70, dir: 0, riding: null,
  ...over,
})

const entered = (over: Partial<PlazaStateResponse> = {}): PlazaStateResponse => ({
  capacity: 20,
  meId: 7,
  members: [member(7), member(8, { color: 'blue' })],
  music: null,
  tracks: [],
  chat: [],
  chatResetAt: '2026-09-26T10:20:00Z',
  colors: ['red', 'blue'],
  ...over,
})

const enter = (over: Partial<PlazaStateResponse> = {}) =>
  plazaReducer(initialPlazaState, { type: 'entered', state: entered(over) })

describe('plazaReducer', () => {
  it('입장 응답을 광장 상태로 옮긴다', () => {
    const state = enter()

    expect(state.joined).toBe(true)
    expect(state.meId).toBe(7)
    expect(state.members.map((m) => m.id)).toEqual([7, 8])
    expect(state.members[0].spawn).toEqual({ x: 50, y: 70, dir: 0 })
  })

  it('같은 사람이 두 번 들어오면 한 번만 센다', () => {
    const state = plazaReducer(enter(), { type: 'member.joined', member: member(8) })

    expect(state.members).toHaveLength(2)
  })

  it('나간 사람의 말풍선과 표정도 함께 지운다', () => {
    let state = plazaReducer(enter(), { type: 'emote.show', memberId: 8, mark: '🎉' })
    state = plazaReducer(state, {
      type: 'chat',
      message: { id: 1, playerId: 8, nickname: '두더지8', avatar: '⛏', color: 'blue',
                 body: '안녕', at: '2026-09-26T10:00:00Z' },
    })

    state = plazaReducer(state, { type: 'member.left', memberId: 8 })

    expect(state.members.map((m) => m.id)).toEqual([7])
    expect(state.bubbles[8]).toBeUndefined()
    expect(state.emotes[8]).toBeUndefined()
  })

  it('내가 보낸 채팅만 me 로 표시한다 — 이름이 겹칠 수 있어 id 로 가른다', () => {
    const state = plazaReducer(enter(), {
      type: 'chat',
      message: { id: 1, playerId: 7, nickname: '두더지7', avatar: '⛏', color: 'red',
                 body: '저요', at: '2026-09-26T10:00:00Z' },
    })

    expect(state.chat.at(-1)?.me).toBe(true)
    expect(state.bubbles[7]).toBe('저요')
  })

  it('채팅에는 색 코드가 아니라 색값을 담는다 — mint 는 CSS 색 이름이 아니다', () => {
    const state = plazaReducer(enter(), {
      type: 'chat',
      message: { id: 1, playerId: 8, nickname: '두더지8', avatar: '⛏', color: 'mint',
                 body: '안녕', at: '2026-09-26T10:00:00Z' },
    })

    expect(state.chat.at(-1)?.colorHex).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('대화가 쌓여도 최근 것만 남긴다', () => {
    let state: PlazaState = enter()
    for (let index = 0; index < PZ_CHAT_KEEP + 10; index++) {
      state = plazaReducer(state, {
        type: 'chat',
        message: { id: index, playerId: 8, nickname: '두더지8', avatar: '⛏', color: 'blue',
                   body: `${index}`, at: '2026-09-26T10:00:00Z' },
      })
    }

    expect(state.chat).toHaveLength(PZ_CHAT_KEEP)
    expect(state.chat[0].body).toBe('10')
  })

  it('10분 경계에는 대화를 비우고 안내 한 줄만 남긴다', () => {
    let state = plazaReducer(enter(), {
      type: 'chat',
      message: { id: 1, playerId: 8, nickname: '두더지8', avatar: '⛏', color: 'blue',
                 body: '안녕', at: '2026-09-26T10:00:00Z' },
    })

    state = plazaReducer(state, { type: 'chat.reset' })

    expect(state.chat).toHaveLength(1)
    expect(state.chat[0].system).toBe(true)
    expect(state.bubbles).toEqual({})
  })

  it('기구에 타면 걷기를 멈추고, 내리면 자리를 비운다', () => {
    let state = plazaReducer(enter(), {
      type: 'member.walking', walking: { 8: true },
    })
    state = plazaReducer(state, { type: 'member.ride', memberId: 8, spot: 'seesaw', seat: 1 })

    expect(state.members[1].riding).toEqual({ spot: 'seesaw', seat: 1 })
    expect(state.members[1].walking).toBe(false)

    state = plazaReducer(state, { type: 'member.dismount', memberId: 8 })
    expect(state.members[1].riding).toBeNull()
  })

  it('프로필과 색은 그 사람만 바꾼다', () => {
    let state = plazaReducer(enter(), {
      type: 'member.profile', memberId: 8, nickname: '곡괭이', avatar: '💎',
    })
    state = plazaReducer(state, { type: 'member.color', memberId: 8, color: 'mint' })

    expect(state.members[1]).toMatchObject({ nickname: '곡괭이', avatar: '💎', color: 'mint' })
    expect(state.members[0]).toMatchObject({ nickname: '두더지7', color: 'red' })
  })

  it('걷기 상태가 그대로면 상태 객체를 새로 만들지 않는다', () => {
    const state = enter()

    expect(plazaReducer(state, { type: 'member.walking', walking: { 7: false } })).toBe(state)
  })

  it('나가면 처음 상태로 돌아간다', () => {
    expect(plazaReducer(enter(), { type: 'left' })).toEqual(initialPlazaState)
  })
})
