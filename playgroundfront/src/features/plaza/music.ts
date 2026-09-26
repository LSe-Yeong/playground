import type { PlazaMusicResponse } from '../../api/types'

/**
 * 광장 음악 (P-15 ~ P-19).
 *
 * 서버는 startedAt 만 준다. 남은 초를 들고 있으면 탭이 멈췄다 돌아왔을 때 어긋나므로,
 * 재생 위치는 늘 "지금(서버 시각) − startedAt" 으로 다시 구한다. 늦게 들어온 사람도
 * 같은 값을 얻어 모두가 같은 지점을 듣는다.
 *
 * 음원은 서버가 중계하지 않는다. srcUrl 로 브라우저가 직접 받는다.
 */
export function elapsedSeconds(music: PlazaMusicResponse, serverNow: number) {
  const started = new Date(music.startedAt).getTime()
  return Math.max(0, Math.min(music.durationSec, (serverNow - started) / 1000))
}

/** 계산 위치에서 이만큼 벗어나면 오디오를 다시 맞춘다 (탭 정지·버퍼링) */
const DRIFT_TOLERANCE_SEC = 1.5

export class PlazaAudio {
  private element: HTMLAudioElement | null = null
  private volume = 0.7
  private playing: string | null = null

  private ensure() {
    if (this.element || typeof Audio === 'undefined') return this.element
    this.element = new Audio()
    this.element.preload = 'none'
    this.element.loop = false
    return this.element
  }

  setVolume(value: number) {
    this.volume = Math.max(0, Math.min(100, value)) / 100
    if (this.element) this.element.volume = this.volume
  }

  /** 지금 나와야 할 곡과 위치로 맞춘다. 이미 그 곡이면 어긋난 만큼만 고친다 */
  sync(music: PlazaMusicResponse | null, at: number): 'blocked' | 'ok' {
    const audio = this.ensure()
    if (!audio) return 'ok'

    if (!music) {
      this.stop()
      return 'ok'
    }

    audio.volume = this.volume
    if (this.playing !== music.srcUrl) {
      this.playing = music.srcUrl
      audio.src = music.srcUrl
      audio.load()
      this.seek(audio, at)
      /* 브라우저는 사용자가 누르기 전에는 소리를 내지 않는다. 곡 선택이 그 누름이다 */
      audio.play().catch(() => undefined)
      return 'ok'
    }

    if (!audio.paused && Math.abs(audio.currentTime - at) > DRIFT_TOLERANCE_SEC) {
      this.seek(audio, at)
    }
    return 'ok'
  }

  stop() {
    this.playing = null
    if (!this.element) return
    this.element.pause()
    this.seek(this.element, 0)
  }

  private seek(audio: HTMLAudioElement, at: number) {
    try {
      audio.currentTime = at
    } catch {
      /* 아직 메타데이터가 없으면 던진다. 다음 보정 때 다시 맞춘다 */
    }
  }
}
