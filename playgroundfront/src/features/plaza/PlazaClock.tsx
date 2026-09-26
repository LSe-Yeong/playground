import { useEffect, useState } from 'react'
import { PZ_TOD_ICON, clockText, timeOfDay } from './constants'

/**
 * 광장 왼쪽 아래 시계 (P-20). 시간대 아이콘이 함께 바뀐다 (P-21).
 * 1초마다 다시 그리는 게 여기뿐이라, 시각을 위로 올리지 않고 안에서 센다.
 */
export function PlazaClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="pz-clock" aria-hidden="true">
      <span>{PZ_TOD_ICON[timeOfDay(now.getHours())]}</span>
      <b>{clockText(now)}</b>
    </div>
  )
}
