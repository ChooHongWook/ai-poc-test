// AI 스키마 프리셋 템플릿

let fieldIdCounter = 0
function nextFieldId(): string {
  return `field-${++fieldIdCounter}`
}

export interface SchemaField {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'array'
  description: string
  isRequired: boolean
}

export interface SchemaPreset {
  id: string
  label: string
  description: string
  fields: SchemaField[]
}

export function createField(
  partial: Partial<Omit<SchemaField, 'id'>> = {},
): SchemaField {
  return {
    id: nextFieldId(),
    name: partial.name ?? '',
    type: partial.type ?? 'string',
    description: partial.description ?? '',
    isRequired: partial.isRequired ?? true,
  }
}

// integer → number 매핑 포함
const TYPE_MAP: Record<string, SchemaField['type']> = {
  string: 'string',
  number: 'number',
  integer: 'number',
  boolean: 'boolean',
  array: 'array',
}

export const SCHEMA_PRESETS: readonly SchemaPreset[] = [
  {
    id: 'document-summary',
    label: '문서 요약',
    description: '문서의 제목, 요약, 핵심 키워드 추출',
    fields: [
      createField({ name: 'title', type: 'string', description: '문서 제목' }),
      createField({
        name: 'summary',
        type: 'string',
        description: '핵심 요약 (3-5문장)',
      }),
      createField({
        name: 'keywords',
        type: 'array',
        description: '핵심 키워드 목록',
      }),
    ],
  },
  {
    id: 'data-extraction',
    label: '데이터 추출',
    description: '이름, 날짜, 금액 등 정형 데이터 추출',
    fields: [
      createField({
        name: 'name',
        type: 'string',
        description: '이름 또는 명칭',
      }),
      createField({ name: 'date', type: 'string', description: '관련 날짜' }),
      createField({ name: 'amount', type: 'number', description: '금액' }),
      createField({ name: 'category', type: 'string', description: '분류' }),
    ],
  },
  {
    id: 'classification',
    label: '분류 / 라벨링',
    description: '카테고리, 감성, 신뢰도 분류',
    fields: [
      createField({
        name: 'category',
        type: 'string',
        description: '분류 카테고리',
      }),
      createField({
        name: 'sentiment',
        type: 'string',
        description: '감성 (긍정/부정/중립)',
      }),
      createField({
        name: 'confidence',
        type: 'number',
        description: '신뢰도 (0~1)',
      }),
      createField({
        name: 'reasoning',
        type: 'string',
        description: '분류 근거',
      }),
    ],
  },
  {
    id: 'qa',
    label: 'Q&A 추출',
    description: '질문-답변 쌍 추출',
    fields: [
      createField({ name: 'question', type: 'string', description: '질문' }),
      createField({ name: 'answer', type: 'string', description: '답변' }),
      createField({
        name: 'source',
        type: 'string',
        description: '출처 (페이지, 섹션 등)',
      }),
    ],
  },
]

/**
 * SchemaField 배열 → JSON Schema 문자열 변환
 * 빈 이름, 중복 이름 필드는 자동 필터링
 */
export function fieldsToJsonSchema(fields: SchemaField[]): string {
  const properties: Record<string, object> = {}
  const required: string[] = []
  const seen = new Set<string>()

  for (const field of fields) {
    const name = field.name.trim()
    if (!name) continue
    if (seen.has(name)) continue
    seen.add(name)

    if (field.type === 'array') {
      properties[name] = {
        type: 'array',
        items: { type: 'string' },
        description: field.description,
      }
    } else {
      properties[name] = {
        type: field.type,
        description: field.description,
      }
    }
    if (field.isRequired) {
      required.push(name)
    }
  }

  return JSON.stringify({ type: 'object', properties, required }, null, 2)
}

/**
 * JSON Schema 문자열 → SchemaField 배열 파싱 (빌더 동기화용)
 * 파싱 실패 시 null 반환
 */
export function jsonSchemaToFields(jsonStr: string): SchemaField[] | null {
  try {
    const schema = JSON.parse(jsonStr) as {
      properties?: Record<
        string,
        { type?: string; description?: string; items?: { type?: string } }
      >
      required?: string[]
    }
    if (!schema.properties) return null

    const requiredSet = new Set(schema.required ?? [])

    return Object.entries(schema.properties).map(([name, prop]) =>
      createField({
        name,
        type: TYPE_MAP[prop.type ?? 'string'] ?? 'string',
        description: prop.description ?? '',
        isRequired: requiredSet.has(name),
      }),
    )
  } catch {
    return null
  }
}
