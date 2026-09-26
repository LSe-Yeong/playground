import type { ReactNode } from 'react'

interface Props {
  title: string
  narrow?: boolean
  onClose: () => void
  children: ReactNode
}

/** 화면 가운데 뜨는 모달 껍데기. 프로토타입의 .overlay > .overlay-box 구조 그대로다. */
export function Overlay({ title, narrow = true, onClose, children }: Props) {
  return (
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
    </div>
  )
}
