import { AVATARS } from '../profile'
import { Overlay } from './Overlay'

interface Props {
  current: string
  onPick: (avatar: string) => void
  onClose: () => void
}

export function AvatarOverlay({ current, onPick, onClose }: Props) {
  return (
    <Overlay title="프로필 사진" onClose={onClose}>
      <div className="avatar-grid">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            type="button"
            className={avatar === current ? 'avatar-opt on' : 'avatar-opt'}
            onClick={() => onPick(avatar)}
          >
            {avatar}
          </button>
        ))}
      </div>
    </Overlay>
  )
}
