import { patch, post } from './client'
import type { SessionResponse } from './types'

/**
 * 세션을 보장한다. 살아 있는 세션이 있으면 그것을 쓰고, 없을 때만 새로 만든다.
 * 쿠키가 HttpOnly 라 클라이언트는 세션이 있는지 스스로 알 수 없어, 진입할 때마다 그냥 부른다.
 */
export const issueSession = (nickname: string, avatar: string) =>
  post<SessionResponse>('/sessions', { nickname, avatar })

/** 바꿀 값만 보낸다. 광장에 있으면 서버가 캐릭터에도 즉시 반영한다 (0-7) */
export const updateMyProfile = (body: { nickname?: string; avatar?: string }) =>
  patch<SessionResponse>('/sessions/me', body)
