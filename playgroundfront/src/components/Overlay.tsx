import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface Props {
  title: string
  narrow?: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * 화면 가운데 뜨는 모달 (.overlay > .overlay-box).
 *
 * body 에 직접 붙인다. 화면 안에 두면 같은 쌓임 맥락에서 놀이기구(z-index 940)나
 * 진행바(1000)와 겨루게 돼 모달이 그 아래로 깔린다. 프로토타입도 #app 바깥에 뒀다.
 */
export function Overlay({ title, narrow = true, onClose, children }: Props) {
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div
        className={narrow ? 'overlay-box narrow' : 'overlay-box'}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="overlay-top">
          <h2>{title}</h2>
          <button type="button" className="btn icon" onClick={onClose}>
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  )
}
