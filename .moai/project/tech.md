# Technology Stack

## 핵심 프레임워크

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.3.1 | UI 라이브러리 |
| TypeScript | 5.9+ | 정적 타입 시스템 |
| Vite | 6.3.5 | 빌드 도구 / 개발 서버 |
| Tailwind CSS | 4.1.12 | 유틸리티 CSS |

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
| @emotion/react | 11.14.0 | CSS-in-JS (MUI 의존) |
| @emotion/styled | 11.14.1 | 스타일드 컴포넌트 (MUI 의존) |
| next-themes | 0.4.6 | 라이트/다크 테마 |

## 인터랙션 / 애니메이션

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| motion | 12.23.24 | 애니메이션 |
| react-dnd | 16.0.1 | 드래그 & 드롭 |
| canvas-confetti | 1.9.4 | 축하 효과 |

## 레이아웃 / 디스플레이

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| react-resizable-panels | 2.1.7 | 리사이징 패널 |
| embla-carousel-react | 8.6.0 | 캐러셀 |
| recharts | 2.15.2 | 데이터 시각화 |
| sonner | 2.0.3 | 토스트 알림 |

## 개발 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| @vitejs/plugin-react | 4.7.0 | React JSX 변환 |
| @tailwindcss/vite | 4.1.12 | Tailwind Vite 플러그인 |

## 빌드 / 실행 스크립트

```bash
npm run dev    # Vite 개발 서버 (포트 5173)
npm run build  # 프로덕션 빌드
```

## 배포 환경
- 현재 없음 (로컬 개발 환경만)
- Docker, CI/CD 미설정
- .env 파일 미사용 (API Key는 UI에서 직접 입력)
