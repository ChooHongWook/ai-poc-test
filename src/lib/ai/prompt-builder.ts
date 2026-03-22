// 프롬프트 빌더 - 사용자 요청에서 최종 사용자 프롬프트 텍스트를 구성

import type { InputField } from '@/lib/types';

// @MX:NOTE: buildPrompt는 userPrompt, inputFields, schema를 조합하여 최종 사용자 프롬프트를 생성
// 각 프로바이더 클라이언트는 내부적으로도 이 조합을 수행하지만,
// 라우트 핸들러에서 로깅/검증 목적으로 최종 프롬프트를 확인할 때 사용

/**
 * 사용자 프롬프트, 입력 필드, JSON 스키마를 조합하여 최종 프롬프트 문자열을 생성
 *
 * @param userPrompt - 사용자가 입력한 기본 프롬프트 텍스트
 * @param inputFields - 추가 입력 데이터 필드 배열 (선택적)
 * @param schema - 출력 형식을 제어하는 JSON 스키마 객체 (선택적)
 * @returns 조합된 최종 프롬프트 문자열
 */
export function buildPrompt(
  userPrompt: string,
  inputFields?: InputField[],
  schema?: object,
): string {
  let prompt = userPrompt;

  // 입력 필드가 있으면 "입력 데이터:" 섹션을 추가
  if (inputFields && inputFields.length > 0) {
    const fieldsText = inputFields
      .map((f) => `${f.label}: ${f.value}`)
      .join('\n');
    prompt += `\n\n입력 데이터:\n${fieldsText}`;
  }

  // JSON 스키마가 있으면 "출력 형식:" 섹션을 추가
  if (schema) {
    prompt += `\n\n출력 형식: 다음 JSON 스키마에 맞는 유효한 JSON으로만 응답해주세요:\n${JSON.stringify(schema, null, 2)}`;
  }

  return prompt;
}
