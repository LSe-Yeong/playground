import type { CSSProperties, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { loadNumber, save } from '../../app/storage'
import { PZ_FONTS, PZ_FONT_DEFAULT } from './constants'
import type { PlazaChatLine } from './types'

interface Props {
  lines: PlazaChatLine[]
  inputRef: RefObject<HTMLInputElement | null>
  onSend: (body: string) => void
}

const FONT_KEY = 'plazaChatFont'

/**
 * 상시 열려 있는 오른쪽 채팅 열 (P-6).
 *
 * 보내고 나면 포커스를 뺀다. 입력칸에 머물면 이동 키가 전부 글자로 들어가 캐릭터가 멈춘다.
 */
export function PlazaChat({ lines, inputRef, onSend }: Props) {
  const [fontStep, setFontStep] = useState(() =>
    loadNumber(FONT_KEY, PZ_FONT_DEFAULT, 0, PZ_FONTS.length - 1))
  const [draft, setDraft] = useState('')
  const logRef = useRef<HTMLUListElement>(null)
  const composing = useRef(false)

  /* 글자가 커지면 아래가 잘리므로 크기가 바뀔 때도 맨 아래로 내린다 */
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [lines, fontStep])

  const stepFont = (next: number) => {
    if (next < 0 || next >= PZ_FONTS.length) return
    setFontStep(next)
    save(FONT_KEY, String(next))
  }

  const send = () => {
    const body = draft.trim()
    if (!body) return
    setDraft('')
    onSend(body)
  }

  return (
    <aside className="pz-chat" style={{ '--pz-chat-fs': `${PZ_FONTS[fontStep]}px` } as CSSProperties}>
      <div className="chat-head">
        <strong>놀이터 채팅</strong>
        <div className="pz-font">
          <button type="button" className="btn tiny" title="글자 작게"
                  disabled={fontStep === 0} onClick={() => stepFont(fontStep - 1)}>
            −
          </button>
          <span className="pz-font-n">{PZ_FONTS[fontStep]}</span>
          <button type="button" className="btn tiny" title="글자 크게"
                  disabled={fontStep === PZ_FONTS.length - 1} onClick={() => stepFont(fontStep + 1)}>
            +
          </button>
        </div>
      </div>

      <ul className="chat-log" ref={logRef}>
        {lines.map((line) =>
          line.system ? (
            <li key={line.id} className="sys">{line.body}</li>
          ) : line.me ? (
            <li key={line.id} className="me">
              <span className="chat-bubble">{line.body}</span>
            </li>
          ) : (
            <li key={line.id}>
              <span className="chat-who" style={{ background: line.colorHex }}>{line.avatar}</span>
              <span className="chat-col">
                <b>{line.nickname}</b>
                <span className="chat-bubble">{line.body}</span>
              </span>
            </li>
          ),
        )}
      </ul>

      <div className="chat-input">
        <input
          ref={inputRef}
          value={draft}
          maxLength={60}
          placeholder="메시지 입력"
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
          onCompositionStart={() => { composing.current = true }}
          onCompositionEnd={() => { composing.current = false }}
          onKeyDown={(event) => {
            /* 한글 조합 중 Enter 는 글자를 확정하는 키다 */
            if (composing.current || event.nativeEvent.isComposing) return
            if (event.key === 'Enter') {
              send()
              inputRef.current?.blur()
            }
            if (event.key === 'Escape') inputRef.current?.blur()
          }}
        />
        <button type="button" className="btn primary" onClick={send}>전송</button>
      </div>
    </aside>
  )
}
