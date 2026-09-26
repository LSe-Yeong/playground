import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    /* 화면이 아니라 계산만 검증한다. DOM 이 필요한 곳은 테스트 안에서 직접 흉내 낸다 */
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
