import { useState } from 'react'
import { Overlay } from '../../components/Overlay'
import { PZ_COLORS, PZ_COLORS_PER_PAGE } from './colors'

interface Props {
  current: string
  /** 남이 쓰는 색. 한 색은 한 사람만 쓴다 (P-24) */
  taken: string[]
  onPick: (colorId: string) => void
  onClose: () => void
}

/**
 * 캐릭터 색 고르기 (P-24).
 * 24색을 한 번에 늘어놓으면 모달이 너무 길어져 10개씩 끊어 보여준다.
 */
export function ColorOverlay({ current, taken, onPick, onClose }: Props) {
  const pageCount = Math.ceil(PZ_COLORS.length / PZ_COLORS_PER_PAGE)
  const [page, setPage] = useState(
    Math.floor(PZ_COLORS.findIndex((color) => color.id === current) / PZ_COLORS_PER_PAGE) || 0,
  )
  const start = page * PZ_COLORS_PER_PAGE
  const shown = PZ_COLORS.slice(start, start + PZ_COLORS_PER_PAGE)

  return (
    <Overlay title="캐릭터 색" onClose={onClose}>
      <div className="swatches">
        {shown.map((color) => {
          const isTaken = color.id !== current && taken.includes(color.id)
          return (
            <button
              key={color.id}
              type="button"
              className={color.id === current ? 'swatch on' : 'swatch'}
              style={{ background: color.hex }}
              title={color.name}
              aria-label={color.name}
              disabled={isTaken}
              onClick={() => onPick(color.id)}
            />
          )
        })}
      </div>

      {/* 페이지가 하나뿐이면 이동 UI 를 숨긴다 */}
      {pageCount > 1 && (
        <div className="pz-color-pager">
          <button
            type="button"
            className="btn icon"
            aria-label="이전 색"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            ‹
          </button>
          <span className="pz-font-n">{page + 1} / {pageCount}</span>
          <button
            type="button"
            className="btn icon"
            aria-label="다음 색"
            disabled={page === pageCount - 1}
            onClick={() => setPage(page + 1)}
          >
            ›
          </button>
        </div>
      )}

      <p className="hint">다른 사람이 쓰는 색은 고를 수 없습니다</p>
    </Overlay>
  )
}
