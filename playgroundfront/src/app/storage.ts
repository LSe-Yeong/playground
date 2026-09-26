/**
 * localStorage 는 시크릿 창이나 차단 설정에서 던질 수 있어 항상 감싼다.
 * 읽지 못하면 기본값으로 시작하면 되는 값들만 여기 둔다.
 */
const PREFIX = 'playground.'

export function load<T>(key: string, parse: (raw: string) => T | null, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    /* 없으면 null 인데 Number(null) 은 0 이라, 그냥 넘기면 최소값으로 시작한다 */
    if (raw === null) return fallback
    return parse(raw) ?? fallback
  } catch {
    return fallback
  }
}

export function save(key: string, value: string) {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    /* 저장하지 못해도 이번 세션은 그대로 쓴다 */
  }
}

export function loadNumber(key: string, fallback: number, min: number, max: number) {
  return load(key, (raw) => {
    const value = Number(raw)
    return Number.isFinite(value) && value >= min && value <= max ? value : null
  }, fallback)
}
