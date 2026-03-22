/**
 * MSW Node.js 환경 서버 설정
 * 테스트 환경에서 fetch 요청을 인터셉트하기 위한 setupServer 인스턴스
 */
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// @MX:ANCHOR: 테스트용 MSW 노드 서버 - vitest 환경에서 사용
// @MX:REASON: 테스트 파일에서 import하여 beforeAll/afterAll로 서버 생명주기 관리
export const server = setupServer(...handlers)
