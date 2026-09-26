/** 하늘·해·구름·언덕·잔디와 가운데 흙빛 광장 (P-5). 색은 시간대에 따라 CSS 가 바꾼다. */
export function PlazaScene() {
  return (
    <div className="pz-scene" aria-hidden="true">
      <i className="pz-sun" />
      <i className="pz-cloud a" />
      <i className="pz-cloud b" />
      <i className="pz-cloud c" />
      <i className="pz-hill l" />
      <i className="pz-hill r" />
      <i className="pz-ground" />
      <i className="pz-floor" />
    </div>
  )
}
