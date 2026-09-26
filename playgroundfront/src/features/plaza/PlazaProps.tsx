import type { CSSProperties } from 'react'

/**
 * 광장의 놀이기구와 장식. 프로토타입 index.html 의 .pz-prop 아홉 개를 그대로 옮겼다.
 *
 * 좌표·너비·깊이는 인라인 커스텀 속성으로 준다. 기구는 캐릭터와 같은 기준(y)으로
 * z-index 를 받아야 앞뒤로 지나갈 수 있어, CSS 클래스가 아니라 값으로 넘긴다.
 */
type RideState = 'idle' | 'riding' | 'solo-0' | 'solo-1'

interface Props {
  /** 지금 나오는 곡 제목. 없으면 DJ 부스 위 표지가 뜨지 않는다 */
  nowPlaying?: string | null
  /** 사람이 타고 있는 기구는 움직인다. 시소는 혼자면 그쪽으로 기운 채 멈춘다 */
  rides?: Partial<Record<'swing' | 'seesaw' | 'merry', RideState>>
}

const propStyle = (x: number, y: number, w: number, z: number) =>
  ({ '--x': `${x}%`, '--y': `${y}%`, '--w': `${w}%`, '--z': z }) as CSSProperties

const propClass = (ride: RideState = 'idle') =>
  ride === 'idle' ? 'pz-prop' : `pz-prop ${ride.startsWith('solo') ? `riding ${ride}` : ride}`

export function PlazaProps({ nowPlaying = null, rides = {} }: Props) {
  return (
    <>
      {/* 그네 */}
      <div className={propClass(rides.swing)} id="prop-swing" style={propStyle(16, 66, 17, 660)}>
        <svg viewBox="0 0 210 150">
          <g stroke="#2a9db2" strokeWidth="8" strokeLinecap="round" fill="none">
            <path d="M52 32 22 140M52 32l24 108M178 32l-30 108M178 32l24 108"/>
          </g>
          <path d="M52 32h126" stroke="#3ec1d8" strokeWidth="9" strokeLinecap="round"/>
          <g className="sw-seat">
            <g stroke="#cfd8dd" strokeWidth="3" fill="none">
              <path d="M88 36v62M106 36v62M130 36v72M148 36v72"/>
            </g>
            <rect x="82" y="96" width="30" height="9" rx="4" fill="#f0a03c"/>
            <rect x="124" y="106" width="30" height="9" rx="4" fill="#f0a03c"/>
          </g>
          <g fill="#e8503f">
            <circle cx="52" cy="32" r="7"/><circle cx="178" cy="32" r="7"/>
            <rect x="34" y="92" width="14" height="7" rx="3"/>
            <rect x="162" y="92" width="14" height="7" rx="3"/>
          </g>
        </svg>
      </div>

      {/* 터널 아치 */}
      <div className="pz-prop" style={propStyle(45, 60, 14, 600)}>
        <svg viewBox="0 0 210 100">
          <g fill="none" strokeLinecap="round">
            <path d="M18 92a28 34 0 0 1 56 0" stroke="#9a7fd0" strokeWidth="15"/>
            <path d="M18 92a28 34 0 0 1 56 0" stroke="#b39ae0" strokeWidth="9"/>
            <path d="M66 88a28 34 0 0 1 56 0" stroke="#9a7fd0" strokeWidth="15"/>
            <path d="M66 88a28 34 0 0 1 56 0" stroke="#b39ae0" strokeWidth="9"/>
            <path d="M114 84a28 34 0 0 1 56 0" stroke="#9a7fd0" strokeWidth="15"/>
            <path d="M114 84a28 34 0 0 1 56 0" stroke="#b39ae0" strokeWidth="9"/>
          </g>
        </svg>
      </div>

      {/* 시소 */}
      <div className={propClass(rides.seesaw)} id="prop-seesaw" style={propStyle(64, 74, 13, 740)}>
        <svg viewBox="0 0 200 90">
          <path d="M84 76h32l-16-30z" fill="#e8503f"/>
          <g className="ss-plank">
            <path d="M14 42h172v8H14z" fill="#5bc236"/>
            <path d="M14 50h172v5H14z" fill="#4aa81f"/>
            <circle cx="26" cy="36" r="6" fill="#e8503f"/>
            <circle cx="174" cy="36" r="6" fill="#e8503f"/>
          </g>
        </svg>
      </div>

      {/* 미끄럼틀 */}
      <div className="pz-prop" style={propStyle(88, 90, 15, 900)}>
        <svg viewBox="0 0 210 160">
          <g stroke="#2f7d24" strokeWidth="7" strokeLinecap="round" fill="none">
            <path d="M150 52v96M186 52v96"/>
            <path d="M150 66h36M150 84h36M150 102h36M150 120h36"/>
          </g>
          <path d="M120 48h70v10h-70z" fill="#4aa81f"/>
          <path d="M18 146l104-96 14 10-96 96z" fill="#c9d6dd"/>
          <path d="M14 140l104-96 8 8-100 96z" fill="#e6edf1"/>
          <g stroke="#4aa81f" strokeWidth="6" strokeLinecap="round" fill="none">
            <path d="M124 46 26 138M138 56 40 148"/>
          </g>
        </svg>
      </div>

      {/* 회전무대 */}
      <div className={propClass(rides.merry)} id="prop-merry" style={propStyle(9, 88, 10, 880)}>
        <svg viewBox="0 0 150 130">
          <path d="M12 52v42a63 20 0 0 0 126 0V52z" fill="#c93d2d"/>
          <ellipse cx="75" cy="94" rx="63" ry="20" fill="#e8503f"/>
          <g className="mg-bars" stroke="#f7b2a8" strokeWidth="3" fill="none">
            <path d="M22 60v40M40 66v42M58 70v44M75 72v44M92 70v44M110 66v42M128 60v40"/>
          </g>
          <ellipse cx="75" cy="52" rx="63" ry="20" fill="#e8503f"/>
          <ellipse cx="75" cy="52" rx="48" ry="14" fill="#c93d2d"/>
          <g className="mg-top" stroke="#f7b2a8" strokeWidth="4" fill="none">
            <path d="M27 52h96M75 38v28"/>
          </g>
        </svg>
      </div>

      {/* 벤치 */}
      <div className="pz-prop" style={propStyle(94, 74, 9.5, 740)}>
        <svg viewBox="0 0 150 80">
          <path d="M10 34h120v9H10zM10 48h120v9H10z" fill="#f0a03c"/>
          <path d="M130 34l12-7v9l-12 7zM130 48l12-7v9l-12 7z" fill="#d9722a"/>
          <g fill="#a9743f"><rect x="20" y="52" width="8" height="22" rx="3"/><rect x="112" y="52" width="8" height="22" rx="3"/></g>
        </svg>
      </div>


      {/* DJ 부스 */}
      <div className="pz-prop pz-dj" style={propStyle(82, 49, 12, 490)}>
        <svg viewBox="0 0 220 150">
          <g>
            <path d="M10 66h32v70H10z" fill="#46596a"/>
            <path d="M42 66l11-7v70l-11 7z" fill="#33434f"/>
            <path d="M10 66l11-7h32l-11 7z" fill="#5d7284"/>
            <circle cx="26" cy="90" r="10" fill="#20303a"/><circle cx="26" cy="90" r="4" fill="#9db0bd"/>
            <circle cx="26" cy="116" r="6" fill="#20303a"/>
          </g>
          <g>
            <path d="M167 66h32v70h-32z" fill="#46596a"/>
            <path d="M199 66l11-7v70l-11 7z" fill="#33434f"/>
            <path d="M167 66l11-7h32l-11 7z" fill="#5d7284"/>
            <circle cx="183" cy="90" r="10" fill="#20303a"/><circle cx="183" cy="90" r="4" fill="#9db0bd"/>
            <circle cx="183" cy="116" r="6" fill="#20303a"/>
          </g>
          <path d="M60 84h100v52H60z" fill="#e8503f"/>
          <path d="M160 84l12-8v52l-12 8z" fill="#c93d2d"/>
          <path d="M52 84l12-8h108l-12 8z" fill="#ffd7cf"/>
          <g fill="#ffb3a8">
            <rect x="70" y="98" width="10" height="26" rx="5"/><rect x="86" y="104" width="10" height="20" rx="5"/>
            <rect x="102" y="94" width="10" height="30" rx="5"/><rect x="118" y="104" width="10" height="20" rx="5"/>
            <rect x="134" y="98" width="10" height="26" rx="5"/>
          </g>
          <ellipse cx="88" cy="78" rx="16" ry="6" fill="#20303a"/>
          <ellipse cx="88" cy="77" rx="9" ry="3.4" fill="#ffcf33"/>
          <ellipse cx="140" cy="78" rx="16" ry="6" fill="#20303a"/>
          <ellipse cx="140" cy="77" rx="9" ry="3.4" fill="#ffcf33"/>
          <rect x="106" y="72" width="16" height="10" rx="3" fill="#2a9db2"/>
        </svg>

        <div className="pz-dj-labels">
          {nowPlaying && <div className="pz-now">♪ <span>{nowPlaying}</span></div>}
        </div>
      </div>
      {/* 지그재그 바 */}
      <div className="pz-prop" style={propStyle(32, 93, 10, 930)}>
        <svg viewBox="0 0 160 90">
          <path d="M16 78V46l34-22 34 22 34-22 26 16" fill="none"
                stroke="#1ba295" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 78V46l34-22 34 22 34-22 26 16" fill="none"
                stroke="#25c2b0" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* 가로등 */}
      <div className="pz-prop pz-lamp" style={propStyle(63, 62, 5, 620)}>
        <svg viewBox="0 0 40 110">
          <rect x="16" y="24" width="8" height="84" rx="4" fill="#2a9db2"/>
          <ellipse cx="20" cy="22" rx="17" ry="8" fill="#20303a"/>
          <ellipse cx="20" cy="19" rx="17" ry="8" fill="#ffcf33"/>
        </svg>
      </div>
    </>
  )
}
