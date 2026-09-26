import { useCallback, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastKind } from './toastContext'

interface Toast {
  id: number
  message: string
  kind: ToastKind
  leaving?: boolean
}

const SHOW_MS = 2000
const FADE_MS = 260

/** 프로토타입의 .toast-area 와 같은 자리·같은 수명이다 (0-2). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const show = useCallback((message: string, kind: ToastKind = '') => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, message, kind }])
    window.setTimeout(() => {
      setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
      window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), FADE_MS)
    }, SHOW_MS)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-area">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={['toast', toast.kind, toast.leaving ? 'out' : ''].filter(Boolean).join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
