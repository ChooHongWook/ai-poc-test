/**
 * MSW 초기화 진입점
 * 환경에 따라 브라우저 또는 Node.js 서버를 초기화
 */

// 브라우저 환경에서 MSW 서비스 워커 시작
// NEXT_PUBLIC_ENABLE_MSW=false로 설정하면 MSW를 비활성화하고 실제 API를 사용
export async function initMSW(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  // MSW 비활성화 환경변수 체크
  if (process.env.NEXT_PUBLIC_ENABLE_MSW === 'false') {
    console.log('[MSW] 비활성화됨 (NEXT_PUBLIC_ENABLE_MSW=false)')
    return
  }

  const { worker } = await import('./browser')
  await worker.start({
    onUnhandledRequest: 'bypass',
  })
}
