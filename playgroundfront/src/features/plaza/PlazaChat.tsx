import type { CSSProperties } from 'react'
import { useEffect, useRef } from 'react'
import { PZ_FONTS } from './constants'
import type { PlazaChatLine } from './types'

interface Props {
  lines: PlazaChatLine[]
  /** PZ_FONTS 의 인덱스 (P-8) */
  fontStep: number
  onFontStep: (step: number) => void
  draft: string
  onDraftChange: (draft: string) => void
  onSend: () => void
}

/**
 * 상시 열려 있는 오른쪽 채팅 열 (P-6).
 * 띄우지 않고 자리를 주는 방식이라 광장은 좁아질 뿐 가려지는 곳이 없다 —
 * 광장 좌표가 전부 % 라 비례해서 줄어든다.
 */
export function PlazaChat({ lines, fontStep, onFontStep, draft, onDraftChange, onSend }: Props) {
  const logRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [lines])

  return (
    <aside className="pz-chat" style={{ '--pz-chat-fs': `${PZ_FONTS[fontStep]}px` } as CSSProperties}>
      <div className="chat-head">
        <strong>놀이터 채팅</strong>
        <div className="pz-font">
          <button
            type="button"
            className="btn tiny"
            title="글자 작게"
            disabled={fontStep === 0}
            onClick={() => onFontStep(fontStep - 1)}
          >
            −
          </button>
          <span className="pz-font-n">{PZ_FONTS[fontStep]}</span>
          <button
            type="button"
            className="btn tiny"
            title="글자 크게"
            disabled={fontStep === PZ_FONTS.length - 1}
            onClick={() => onFontStep(fontStep + 1)}
          >
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
              <span className="chat-who" style={{ background: line.colorHex }}>
                {line.avatar}
              </span>
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
          value={draft}
          maxLength={60}
          placeholder="메시지 입력"
          autoComplete="off"
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSend()
          }}
        />
        <button type="button" className="btn primary" onClick={onSend}>
          전송
        </button>
      </div>
    </aside>
  )
}
