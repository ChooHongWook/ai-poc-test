// 결과 내보내기 유틸리티 - JSON/CSV/마크다운/클립보드

// 내보내기 데이터 구조 정의
export interface ExportData {
  chatgpt?: Record<string, string>;
  gemini?: Record<string, string>;
  claude?: Record<string, string>;
  metadata?: {
    generatedAt: string;
    systemPrompt?: string;
    userPrompt?: string;
  };
}

/**
 * 클립보드에 JSON 복사
 * @returns 성공 여부
 */
export async function copyToClipboard(data: unknown): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * JSON 파일 다운로드
 */
export function downloadJSON(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  triggerDownload(blob, filename ?? `aipoc_result_${getTimestamp()}.json`);
}

/**
 * CSV 파일 다운로드 (프로바이더 비교 형식, BOM 포함 한글 지원)
 *
 * 헤더: provider, key1, key2, ...
 * 각 행: ChatGPT, val1, val2, ...
 */
export function downloadCSV(data: ExportData, filename?: string): void {
  // 모든 프로바이더에서 유니크한 키 수집
  const allKeys = new Set<string>();
  const providers: Array<{ name: string; providerKey: keyof ExportData }> = [
    { name: 'ChatGPT', providerKey: 'chatgpt' },
    { name: 'Gemini', providerKey: 'gemini' },
    { name: 'Claude', providerKey: 'claude' },
  ];

  for (const { providerKey } of providers) {
    const providerData = data[providerKey];
    if (providerData) {
      Object.keys(providerData).forEach((key) => allKeys.add(key));
    }
  }

  const keys = Array.from(allKeys);

  // 헤더 행: provider, key1, key2, ...
  const headerRow = ['provider', ...keys].map(escapeCsvCell).join(',');

  // 각 프로바이더 데이터 행 생성
  const dataRows = providers
    .filter(({ providerKey }) => data[providerKey] !== undefined)
    .map(({ name, providerKey }) => {
      const providerData = data[providerKey] ?? {};
      const cells = [
        name,
        ...keys.map(
          (key) => (providerData as Record<string, string>)[key] ?? '',
        ),
      ];
      return cells.map(escapeCsvCell).join(',');
    });

  const csvContent = [headerRow, ...dataRows].join('\n');

  // BOM 추가 (한글 지원)
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  triggerDownload(blob, filename ?? `aipoc_result_${getTimestamp()}.csv`);
}

/**
 * 마크다운 파일 다운로드
 */
export function downloadMarkdown(data: ExportData, filename?: string): void {
  const lines: string[] = ['# AI 문서 생성 결과', ''];

  // 메타데이터 섹션
  if (data.metadata) {
    lines.push('## 생성 정보', '');
    lines.push(`- **생성 시간**: ${data.metadata.generatedAt}`);
    if (data.metadata.systemPrompt) {
      lines.push(`- **시스템 프롬프트**: ${data.metadata.systemPrompt}`);
    }
    if (data.metadata.userPrompt) {
      lines.push(`- **사용자 프롬프트**: ${data.metadata.userPrompt}`);
    }
    lines.push('');
  }

  // 각 프로바이더 결과 섹션
  const providerSections: Array<{
    title: string;
    providerKey: keyof ExportData;
  }> = [
    { title: 'ChatGPT 결과', providerKey: 'chatgpt' },
    { title: 'Gemini 결과', providerKey: 'gemini' },
    { title: 'Claude 결과', providerKey: 'claude' },
  ];

  for (const { title, providerKey } of providerSections) {
    const providerData = data[providerKey];
    if (!providerData) continue;

    lines.push(`## ${title}`, '');

    const entries = Object.entries(providerData);
    if (entries.length === 0) {
      lines.push('_결과 없음_', '');
      continue;
    }

    // 테이블 형식으로 출력
    lines.push('| 항목 | 내용 |');
    lines.push('| --- | --- |');
    for (const [key, value] of entries) {
      // 테이블 셀 내의 파이프 문자 이스케이프
      const escapedKey = key.replace(/\|/g, '\\|');
      const escapedValue = String(value)
        .replace(/\|/g, '\\|')
        .replace(/\n/g, '<br>');
      lines.push(`| ${escapedKey} | ${escapedValue} |`);
    }
    lines.push('');
  }

  const markdown = lines.join('\n');
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  triggerDownload(blob, filename ?? `aipoc_result_${getTimestamp()}.md`);
}

// 내부 헬퍼: 다운로드 트리거
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// 내부 헬퍼: 타임스탬프 문자열 생성 (파일명에 사용)
function getTimestamp(): string {
  return new Date()
    .toISOString()
    .slice(0, 16)
    .replace('T', '_')
    .replace(':', '-');
}

// 내부 헬퍼: CSV 셀 값 이스케이프 처리 (쉼표, 따옴표 포함 시 큰따옴표로 감쌈)
function escapeCsvCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
