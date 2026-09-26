import { useState } from 'react'
import { Overlay } from '../../components/Overlay'
import { PZ_COLORS, PZ_COLORS_PER_PAGE, colorHex } from './colors'

interface Props {
  /** 서버가 준 고를 수 있는 색 전체, 모달 표시 순서대로 (P-24) */
  colors: string[]
  current: string
  /** 남이 쓰는 색. 한 색은 한 사람만 쓴다 */
  taken: string[]
  onPick: (colorId: string) => void
  onClose: () => void
}

const nameOf = (id: string) => PZ_COLORS.find((color) => color.id === id)?.name ?? id

/** 24색을 한 번에 늘어놓으면 모달이 너무 길어져 10개씩 끊어 보여준다 (P-24). */
export function ColorOverlay({ colors, current, taken, onPick, onClose }: Props) {
  const pageCount = Math.max(1, Math.ceil(colors.length / PZ_COLORS_PER_PAGE))
  const [page, setPage] = useState(() =>
    Math.max(0, Math.floor(colors.indexOf(current) / PZ_COLORS_PER_PAGE)))
  const start = page * PZ_COLORS_PER_PAGE
  const shown = colors.slice(start, start + PZ_COLORS_PER_PAGE)

  return (
    <Overlay title="캐릭터 색" onClose={onClose}>
      <div className="pz-swatches">
        {shown.map((id) => {
          const isTaken = id !== current && taken.includes(id)
          return (
            <button
              key={id}
              type="button"
              className={id === current ? 'swatch on' : 'swatch'}
              style={{ background: colorHex(id) }}
              title={nameOf(id)}
              aria-label={nameOf(id)}
              disabled={isTaken}
              onClick={() => onPick(id)}
            />
          )
        })}
      </div>

      {/* 페이지가 하나뿐이면 이동 UI 를 숨긴다 */}
      {pageCount > 1 && (
        <div className="pz-color-pager">
          <button type="button" className="btn icon" aria-label="이전 색"
                  disabled={page === 0} onClick={() => setPage(page - 1)}>
            ‹
          </button>
          <span className="pz-font-n">{page + 1} / {pageCount}</span>
          <button type="button" className="btn icon" aria-label="다음 색"
                  disabled={page === pageCount - 1} onClick={() => setPage(page + 1)}>
            ›
          </button>
        </div>
      )}

      <p className="hint">다른 사람이 쓰는 색은 고를 수 없습니다</p>
    </Overlay>
  )
}
