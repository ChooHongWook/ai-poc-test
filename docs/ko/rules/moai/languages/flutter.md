---
paths: "**/*.dart,**/pubspec.yaml,**/pubspec.lock"
---

# Flutter/Dart 규칙

버전: Flutter 3.24+ / Dart 3.5+

## 도구

- 빌드: flutter CLI
- 린팅: dart analyze, flutter_lints
- 포맷팅: dart format
- 테스트: flutter test
- 패키지 관리: pub

## 반드시 해야 할 것

- 상태 관리에 Riverpod 또는 Provider 사용
- 내비게이션에 go_router 사용
- 불변 모델에 freezed 사용
- 가능한 경우 const 생성자 사용
- null 안전성을 올바르게 처리
- 비즈니스 로직과 UI를 분리

## 반드시 하지 말아야 할 것

- 복잡한 위젯에서 setState 사용
- 비동기 갭을 넘어 BuildContext 사용
- 분석기 경고 무시
- dynamic 타입 사용
- UI 스레드 차단
- 문자열 하드코딩 (l10n 사용)

## 파일 규칙

- 테스트 파일은 *_test.dart
- 파일명은 snake_case 사용
- 클래스명은 PascalCase 사용
- 함수 및 변수명은 camelCase 사용
- 소스는 lib/, 테스트는 test/

## 테스트

- 위젯 테스트에 flutter_test 사용
- 모킹에 mockito 사용
- UI 검증에 골든 테스트 사용
- E2E에 integration_test 사용
