/**
 * 백엔드 호출의 공통 껍데기.
 *
 * 세션이 HttpOnly 쿠키라 모든 요청에 credentials 를 켠다. 빠뜨리면 쿠키가 안 실려
 * 서버가 매번 새 세션을 만들고, 증상만 보고는 원인을 찾기 어렵다.
 */
export const API_BASE =
  import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/pg/api'

/** http(s) 주소에서 소켓 주소를 만든다. 두 곳에 적으면 한쪽만 고치는 사고가 난다. */
export const SOCKET_URL = `${API_BASE.replace(/^http/, 'ws')}/ws`

/** 서버가 내려주는 봉투. 실패하면 data 가 없고 error 가 있다. */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

/** code 로 분기하고 message 는 화면에 그대로 띄울 수 있는 한국어다. */
export class ApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(API_BASE + path, {
      ...init,
      credentials: 'include',
      headers: init.body ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', '서버에 연결할 수 없습니다', 0)
  }

  let body: ApiResponse<T> | null = null
  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    /* 본문이 없는 응답도 있다 */
  }

  if (!response.ok || !body?.success) {
    throw new ApiError(
      body?.error?.code ?? 'INTERNAL_ERROR',
      body?.error?.message ?? '서버 오류가 발생했습니다',
      response.status,
    )
  }
  return body.data as T
}

export const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

export const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })

export const get = <T>(path: string) => request<T>(path)
