import { useState } from 'react'
import { randomNickname } from '../profile'
import { Overlay } from './Overlay'

interface Props {
  current: string
  onSave: (nickname: string) => void
  onClose: () => void
}

/** 셔플 버튼은 입력칸 오른쪽 끝에 겹쳐 둔다. 프로토타입 #overlay-nick 그대로다. */
export function NicknameOverlay({ current, onSave, onClose }: Props) {
  const [value, setValue] = useState(current)
  const trimmed = value.trim()

  return (
    <Overlay title="닉네임 설정" onClose={onClose}>
      <p className="dlg-msg">놀이터에서 쓸 이름입니다</p>
      <label className="field">
        <span>닉네임</span>
        <span className="nick-row">
          <input
            value={value}
            maxLength={12}
            placeholder="12자 이내"
            autoComplete="off"
            onChange={(event) => setValue(event.target.value)}
          />
          <button
            type="button"
            className="nick-shuffle"
            title="랜덤 이름"
            aria-label="랜덤 이름"
            onClick={() => setValue(randomNickname())}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M16 3h5v5" />
              <path d="M4 20 21 3" />
              <path d="M21 16v5h-5" />
              <path d="M15 15l6 6" />
              <path d="M4 4l5 5" />
            </svg>
          </button>
        </span>
      </label>
      <div className="sheet-foot">
        <button type="button" className="btn ghost" onClick={onClose}>
          취소
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={trimmed.length === 0}
          onClick={() => onSave(trimmed)}
        >
          저장
        </button>
      </div>
    </Overlay>
  )
}
