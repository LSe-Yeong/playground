import type { Profile } from '../profile'

interface Props {
  profile: Profile
  onEditNickname: () => void
  onEditAvatar: () => void
}

/** 상단바 오른쪽의 이름 + 아바타. 허브와 광장이 같은 것을 쓴다 (0-7). */
export function ProfileChip({ profile, onEditNickname, onEditAvatar }: Props) {
  return (
    <div className="profile">
      <button type="button" className="pf-name" title="이름 수정" onClick={onEditNickname}>
        {profile.nickname}
      </button>
      <button type="button" className="pf-avatar" title="프로필 사진 변경" onClick={onEditAvatar}>
        {profile.avatar}
      </button>
    </div>
  )
}
