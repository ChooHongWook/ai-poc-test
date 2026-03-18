# Technology Stack

## 핵심 프레임워크

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15.3.3 | 프레임워크 / 빌드 도구 / 개발 서버 |
| React | 18.3.1 | UI 라이브러리 |
| TypeScript | 5.8.3 | 정적 타입 시스템 |
| Tailwind CSS | 4.1.12 | 유틸리티 CSS (@tailwindcss/postcss) |

## UI 컴포넌트 라이브러리

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Radix UI | 40+ 컴포넌트 | 헤드리스 UI 프리미티브 |
| MUI (Material-UI) | 7.3.5 | 추가 UI 컴포넌트 |
| lucide-react | 0.487.0 | 아이콘 |

## 라우팅 / 폼 / 상태

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| React Router | 7.13.0 | 클라이언트 라우팅 |
| React Hook Form | 7.55.0 | 폼 상태 관리 |

## 스타일링

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| class-variance-authority | 0.7.1 | CSS 클래스 변형 관리 |
| clsx | 2.1.1 | 조건부 클래스 |
| tailwind-merge | 3.2.0 | Tailwind 클래스 병합 |
| next-themes | 0.4.6 | 라이트/다크 테마 (ThemeProvider 활성화) |

## 인터랙션 / 애니메이션

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| motion | 12.23.24 | 애니메이션 |

## 레이아웃 / 디스플레이

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react-resizable-panels | 2.1.7 | 리사이징 패널 |
| embla-carousel-react | 8.6.0 | 캐러셀 |
| sonner | 2.0.3 | 토스트 알림 |

## 개발 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| @types/node | 20 | Node.js 타입 정의 |
| @types/react | 18 | React 타입 정의 |
| @types/react-dom | 18 | React DOM 타입 정의 |
| @tailwindcss/postcss | 4.1.12 | Tailwind PostCSS 플러그인 |

## 빌드 / 실행 스크립트

```bash
npm run dev    # Next.js 개발 서버 (포트 3000)
npm run build  # 프로덕션 빌드
npm run start  # 프로덕션 서버 실행
```

## 배포 환경
- 현재 없음 (로컬 개발 환경만)
- Docker, CI/CD 미설정
- .env 파일 미사용 (API Key는 UI에서 직접 입력)
