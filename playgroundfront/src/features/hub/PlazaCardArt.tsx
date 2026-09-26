/** 놀이터 카드의 그림. 프로토타입 app.js 의 GAMES[0].art 그대로다. */
export function PlazaCardArt() {
  return (
    <svg viewBox="0 0 320 180" aria-hidden="true">
      <rect width="320" height="180" fill="#9fd9f2"/>
      <circle cx="268" cy="36" r="22" fill="#ffcf33"/>
      <ellipse cx="60" cy="40" rx="34" ry="14" fill="#fff" opacity=".92"/>
      <ellipse cx="150" cy="26" rx="26" ry="11" fill="#fff" opacity=".85"/>
      <path d="M0 112q80-42 170-18 80 21 150-6v92H0z" fill="#7ec74a"/>
      <rect y="126" width="320" height="54" fill="#63b93a"/>
      <ellipse cx="160" cy="150" rx="104" ry="26" fill="#eed8ae"/>
      <g fill="#a9743f"><rect x="46" y="86" width="7" height="34" rx="3"/><rect x="262" y="92" width="7" height="30" rx="3"/></g>
      <circle cx="50" cy="78" r="22" fill="#5bc236"/><circle cx="34" cy="90" r="14" fill="#4aa81f"/>
      <circle cx="266" cy="84" r="19" fill="#4aa81f"/><circle cx="280" cy="94" r="12" fill="#5bc236"/>
      <ellipse cx="160" cy="140" rx="30" ry="10" fill="#7fc9ec"/>
      <rect x="155" y="112" width="10" height="24" rx="5" fill="#eaf1f4"/>
      <ellipse cx="160" cy="112" rx="15" ry="5" fill="#eaf1f4"/>
      <g>
        <ellipse cx="112" cy="156" rx="13" ry="4" fill="#20303a" opacity=".2"/>
        <path d="M112 128a13 15 0 0 1 13 15v5a13 10 0 0 1-26 0v-5a13 15 0 0 1 13-15z" fill="#f0553d"/>
        <ellipse cx="204" cy="162" rx="13" ry="4" fill="#20303a" opacity=".2"/>
        <path d="M204 134a13 15 0 0 1 13 15v5a13 10 0 0 1-26 0v-5a13 15 0 0 1 13-15z" fill="#2d9cdb"/>
        <ellipse cx="160" cy="170" rx="13" ry="4" fill="#20303a" opacity=".2"/>
        <path d="M160 142a13 15 0 0 1 13 15v5a13 10 0 0 1-26 0v-5a13 15 0 0 1 13-15z" fill="#9b6bdb"/>
      </g>
    </svg>
  )
}
