/**
 * MSW 브라우저 환경 서비스 워커 설정
 * 브라우저에서 fetch 요청을 인터셉트하기 위한 setupWorker 인스턴스
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// @MX:ANCHOR: 브라우저 MSW 서비스 워커 - app/page.tsx의 fetch 호출을 인터셉트
// @MX:REASON: MSWProvider에서 초기화되며 개발 환경에서만 활성화
export const worker = setupWorker(...handlers)
