'use client'

/**
 * MSW 서비스 워커 초기화 Provider
 * 개발 환경에서만 MSW를 활성화하고, 프로덕션에서는 즉시 children을 렌더링
 */
import { useEffect, useState } from 'react'

interface MSWProviderProps {
  children: React.ReactNode
}

// @MX:ANCHOR: MSW 초기화 Provider - app/layout.tsx에서 래핑
// @MX:REASON: 브라우저 환경에서 MSW 서비스 워커가 준비된 후에만 children을 렌더링
export function MSWProvider({ children }: MSWProviderProps) {
  const [mswReady, setMswReady] = useState(false)

  useEffect(() => {
    // 프로덕션 환경에서는 MSW 없이 즉시 렌더링
    if (process.env.NODE_ENV !== 'development') {
      setMswReady(true)
      return
    }

    // 개발 환경에서만 MSW 동적 임포트 및 초기화
    import('@/lib/mock/index')
      .then(({ initMSW }) => initMSW())
      .then(() => setMswReady(true))
      .catch((error: unknown) => {
        console.error('[MSW] 초기화 실패:', error)
        // MSW 실패해도 앱은 계속 동작
        setMswReady(true)
      })
  }, [])

  // MSW가 준비될 때까지 렌더링 지연 (개발 환경에서 첫 요청 경쟁 방지)
  if (!mswReady) {
    return null
  }

  return <>{children}</>
}
