// JSON Schema → Zod 런타임 변환기
// DB에 JSON Schema로 저장된 스키마를 런타임 Zod 객체로 복원

import { z, type ZodTypeAny } from 'zod'

interface JsonSchemaProperty {
  type?: string
  description?: string
  items?: JsonSchemaProperty
  properties?: Record<string, JsonSchemaProperty>
  required?: string[]
  enum?: (string | number)[]
}

/**
 * 개별 JSON Schema property → Zod 스키마 변환
 */
function convertProperty(prop: JsonSchemaProperty): ZodTypeAny {
  if (prop.enum && prop.enum.length > 0) {
    const values = prop.enum.map(String) as [string, ...string[]]
    return z.enum(values)
  }

  switch (prop.type) {
    case 'string':
      return prop.description
        ? z.string().describe(prop.description)
        : z.string()
    case 'number':
    case 'integer':
      return prop.description
        ? z.number().describe(prop.description)
        : z.number()
    case 'boolean':
      return prop.description
        ? z.boolean().describe(prop.description)
        : z.boolean()
    case 'array': {
      const itemSchema = prop.items ? convertProperty(prop.items) : z.unknown()
      return prop.description
        ? z.array(itemSchema).describe(prop.description)
        : z.array(itemSchema)
    }
    case 'object':
      return convertObjectSchema(prop)
    default:
      return z.unknown()
  }
}

/**
 * JSON Schema object → Zod object 변환
 */
function convertObjectSchema(schema: JsonSchemaProperty): ZodTypeAny {
  if (!schema.properties) {
    return z.record(z.unknown())
  }

  const shape: Record<string, ZodTypeAny> = {}
  const requiredFields = new Set(schema.required ?? [])

  for (const [key, prop] of Object.entries(schema.properties)) {
    const fieldSchema = convertProperty(prop)
    shape[key] = requiredFields.has(key) ? fieldSchema : fieldSchema.optional()
  }

  return schema.description
    ? z.object(shape).describe(schema.description)
    : z.object(shape)
}

/**
 * JSON Schema 문자열을 Zod 스키마로 변환
 * DB에서 꺼낸 JSON Schema 문자열을 런타임 Zod 객체로 복원할 때 사용
 *
 * @throws {Error} JSON 파싱 실패 또는 지원하지 않는 스키마 구조
 */
export function jsonSchemaToZod(jsonSchemaStr: string): ZodTypeAny {
  const schema = JSON.parse(jsonSchemaStr) as JsonSchemaProperty
  return convertProperty(schema)
}
