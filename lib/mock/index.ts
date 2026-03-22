/**
 * MSW 초기화 진입점
 * 환경에 따라 브라우저 또는 Node.js 서버를 초기화
 */

// 브라우저 환경에서 MSW 서비스 워커 시작
export async function initMSW(): Promise<void> {
  if (typeof window === 'undefined') {
    // Node.js 환경 (서버사이드)에서는 MSW를 초기화하지 않음
    return
  }

  // 개발 환경에서만 브라우저 워커 동적 임포트
  const { worker } = await import('./browser')
  await worker.start({
    // 처리되지 않은 요청은 실제 네트워크로 통과
    onUnhandledRequest: 'bypass',
  })
}
