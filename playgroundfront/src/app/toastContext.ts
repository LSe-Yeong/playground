import { createContext, useContext } from 'react'

export type ToastKind = '' | 'good' | 'bad'
export type ShowToast = (message: string, kind?: ToastKind) => void

export const ToastContext = createContext<ShowToast>(() => {})

export const useToast = () => useContext(ToastContext)
