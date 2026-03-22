import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Node 환경에서 MSW 핸들러 테스트
    environment: 'node',
    globals: true,
    // 테스트 환경에서 절대 URL을 사용하기 위한 baseURL 설정
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    // tsconfig.json의 paths 별칭과 동일하게 설정
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
