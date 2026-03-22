// 헬스 체크 API 라우트 핸들러

import { NextResponse } from 'next/server';

// @MX:ANCHOR: 헬스 체크 엔드포인트 - 서비스 상태 확인을 위한 공개 API
// @MX:REASON: 외부 모니터링 시스템에서 직접 호출되는 공개 엔드포인트

/**
 * GET /api/health
 * 서버 상태를 반환하는 헬스 체크 엔드포인트
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.0.1',
    },
    { status: 200 },
  );
}
