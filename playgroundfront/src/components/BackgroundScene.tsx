/** 모든 화면 뒤에 고정으로 깔리는 놀이터 풍경. 프로토타입 index.html 의 .pg-scene 그대로다. */
export function BackgroundScene() {
  return (
    <div className="pg-scene">
      <svg viewBox="0 0 560 130" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <rect x="-1400" y="94" width="3360" height="130" fill="#63c62f" stroke="#20303a" strokeWidth="4"/>

        <g stroke="#20303a" strokeWidth="4">
          <rect x="34" y="66" width="11" height="30" fill="#c58f4d"/>
          <circle cx="39.5" cy="56" r="22" fill="#4aa81f"/>
        </g>

        <g fill="none" strokeLinecap="round">
          <path d="M150 94V44M168 94V44" stroke="#20303a" strokeWidth="11"/>
          <path d="M150 94V44M168 94V44" stroke="#2d9cdb" strokeWidth="6"/>
          <path d="M150 58h18M150 72h18M150 86h18" stroke="#20303a" strokeWidth="7"/>
          <path d="M150 58h18M150 72h18M150 86h18" stroke="#2d9cdb" strokeWidth="3"/>
          <path d="M168 44C188 50 196 74 218 94" stroke="#20303a" strokeWidth="18"/>
          <path d="M168 44C188 50 196 74 218 94" stroke="#f0553d" strokeWidth="13"/>
          <path d="M168 44C188 50 196 74 218 94" stroke="#ffcf33" strokeWidth="5"/>
        </g>

        <g fill="none" strokeLinecap="round">
          <path d="M360 94L382 40M436 94L414 40M380 40h36" stroke="#20303a" strokeWidth="12"/>
          <path d="M360 94L382 40M436 94L414 40M380 40h36" stroke="#2d9cdb" strokeWidth="7"/>
          <path d="M390 42v26M408 42v26" stroke="#20303a" strokeWidth="4"/>
          <rect x="383" y="68" width="32" height="9" rx="4" fill="#f0553d" stroke="#20303a" strokeWidth="4"/>
        </g>

        <g stroke="#20303a" strokeWidth="4">
          <circle cx="280" cy="97" r="13" fill="#4aa81f"/>
          <circle cx="296" cy="100" r="9" fill="#4aa81f"/>
          <circle cx="512" cy="95" r="16" fill="#4aa81f"/>
          <circle cx="493" cy="100" r="10" fill="#4aa81f"/>
        </g>

        <g stroke="#20303a" strokeWidth="3" strokeLinecap="round">
          <path d="M96 106l-3-9M102 106l3-9M250 108l-3-9M334 106l3-9M470 108l-3-9"/>
        </g>
      </svg>
    </div>
  )
}
