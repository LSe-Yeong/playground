import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * base 는 번들이 에셋을 가리키는 경로다. 앱이 `/pg/` 아래에 놓이면
 * `/assets/...` 가 아니라 `/pg/assets/...` 를 참조해야 한다.
 *
 * 환경변수로 받는 이유는 개발 서버(npm run dev)를 `/` 그대로 두기 위해서다.
 * 도커 빌드에서만 VITE_BASE 를 넘긴다.
 */
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
