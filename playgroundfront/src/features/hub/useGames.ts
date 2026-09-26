import { useEffect, useState } from 'react'
import { fetchGames } from '../../api/games'
import type { GameResponse } from '../../api/types'

/** 놀이터 인원이 계속 바뀌므로 허브를 보고 있는 동안만 주기적으로 다시 받는다 (0-9) */
const POLL_MS = 5000

export function useGames(active: boolean) {
  const [games, setGames] = useState<GameResponse[]>([])

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const pull = async () => {
      try {
        const response = await fetchGames()
        if (!cancelled) setGames(response.games)
      } catch {
        /* 목록을 못 받아도 화면은 직전 값으로 남겨 둔다 */
      }
    }

    void pull()
    const timer = window.setInterval(pull, POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [active])

  return games
}
