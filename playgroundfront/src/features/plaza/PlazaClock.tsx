import { PZ_TOD_ICON, clockText, timeOfDay } from './constants'

/** 광장 왼쪽 아래 시계 (P-20). 시간대 아이콘이 함께 바뀐다 (P-21). */
export function PlazaClock({ now }: { now: Date }) {
  return (
    <div className="pz-clock" aria-hidden="true">
      <span>{PZ_TOD_ICON[timeOfDay(now.getHours())]}</span>
      <b>{clockText(now)}</b>
    </div>
  )
}
