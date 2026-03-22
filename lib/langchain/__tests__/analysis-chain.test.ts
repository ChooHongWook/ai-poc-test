// Analysis Chain 단위 테스트
// RED 단계: analysis-chain.ts 구현 전 - 테스트 실패 예상
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Document } from '@langchain/core/documents'
import type { AnalysisRequest, AnalysisResponse, ProviderConfig } from '../types'
import { z } from 'zod'

// BaseChatModel 모킹
const mockInvoke = vi.fn()
const mockWithStructuredOutput = vi.fn()

// LangChain 핵심 모듈 모킹
vi.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromMessages: vi.fn().mockReturnValue({
      pipe: vi.fn().mockReturnValue({
        invoke: mockInvoke,
      }),
    }),
  },
}))

vi.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: vi.fn().mockImplementation(() => ({
    parse: vi.fn((input: string) => input),
  })),
}))

// 테스트용 모의 BaseChatModel
const createMockModel = (overrides: Record<string, unknown> = {}) => {
  return {
    invoke: mockInvoke,
    withStructuredOutput: mockWithStructuredOutput,
    pipe: vi.fn().mockReturnThis(),
    ...overrides,
  }
}

describe('analyzeDocuments', () => {
  // 테스트용 샘플 Document
  const sampleDocs: Document[] = [
    {
      pageContent: '이것은 테스트 문서 내용입니다.',
      metadata: { source: 'test.txt' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // 기본 invoke 모킹 (일반 텍스트 응답)
    mockInvoke.mockResolvedValue({
      content: 'AI 분석 결과입니다.',
    })

    // withStructuredOutput 모킹
    mockWithStructuredOutput.mockReturnValue({
      invoke: vi.fn().mockResolvedValue({ summary: '구조화된 요약' }),
      pipe: vi.fn().mockReturnThis(),
    })
  })

  it('단일 제공자로 분석 요청 시 ProviderResult 반환', async () => {
    // Arrange
    const mockModel = createMockModel()
    const providers: ProviderConfig[] = [
      { name: 'TestProvider', model: mockModel as unknown as ProviderConfig['model'] },
    ]
    const request: AnalysisRequest = {
      documents: sampleDocs,
      providers,
    }

    const { analyzeDocuments } = await import('../analysis-chain')

    // Act
    const response: AnalysisResponse = await analyzeDocuments(request)

    // Assert
    expect(response).toHaveProperty('results')
    expect(response.results).toBeInstanceOf(Array)
    expect(response.results.length).toBe(1)
    expect(response.results[0].provider).toBe('TestProvider')
    expect(response.results[0].success).toBe(true)
  })

  it('AC-02: 복수 제공자 동시 분석 - Promise.allSettled 사용', async () => {
    // Arrange
    const mockModel1 = createMockModel()
    const mockModel2 = createMockModel()
    const mockModel3 = createMockModel()

    const providers: ProviderConfig[] = [
      { name: 'Provider1', model: mockModel1 as unknown as ProviderConfig['model'] },
      { name: 'Provider2', model: mockModel2 as unknown as ProviderConfig['model'] },
      { name: 'Provider3', model: mockModel3 as unknown as ProviderConfig['model'] },
    ]
    const request: AnalysisRequest = {
      documents: sampleDocs,
      providers,
    }

    const { analyzeDocuments } = await import('../analysis-chain')

    // Act
    const response = await analyzeDocuments(request)

    // Assert: 3개의 결과가 반환되어야 함
    expect(response.results.length).toBe(3)
    const names = response.results.map((r) => r.provider)
    expect(names).toContain('Provider1')
    expect(names).toContain('Provider2')
    expect(names).toContain('Provider3')
  })

  it('AC-03: 부분 실패 처리 - 하나 실패해도 나머지 결과 반환', async () => {
    // Arrange: 두 번째 호출에서 에러 발생
    const successModel = createMockModel()
    const failModel = createMockModel({
      invoke: vi.fn().mockRejectedValue(new Error('API 인증 실패')),
    })

    const providers: ProviderConfig[] = [
      { name: 'SuccessProvider', model: successModel as unknown as ProviderConfig['model'] },
      { name: 'FailProvider', model: failModel as unknown as ProviderConfig['model'] },
    ]
    const request: AnalysisRequest = {
      documents: sampleDocs,
      providers,
    }

    const { analyzeDocuments } = await import('../analysis-chain')

    // Act
    const response = await analyzeDocuments(request)

    // Assert: 전체 요청이 실패하지 않고 2개 결과 반환
    expect(response.results.length).toBe(2)

    const successResult = response.results.find((r) => r.provider === 'SuccessProvider')
    const failResult = response.results.find((r) => r.provider === 'FailProvider')

    expect(successResult?.success).toBe(true)
    expect(failResult?.success).toBe(false)
    expect(failResult?.error).toBeDefined()
  })

  it('AC-05: Zod 스키마 제공 시 구조화 출력 반환', async () => {
    // Arrange: Zod 스키마 정의
    const schema = z.object({
      summary: z.string().describe('문서 요약'),
      keywords: z.array(z.string()).describe('주요 키워드'),
    })

    const mockStructuredInvoke = vi.fn().mockResolvedValue({
      summary: '테스트 요약',
      keywords: ['테스트', '키워드'],
    })

    const mockModel = {
      invoke: mockInvoke,
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: mockStructuredInvoke,
        pipe: vi.fn().mockReturnThis(),
      }),
    }

    const providers: ProviderConfig[] = [
      { name: 'TestProvider', model: mockModel as unknown as ProviderConfig['model'] },
    ]
    const request: AnalysisRequest = {
      documents: sampleDocs,
      providers,
      schema,
    }

    const { analyzeDocuments } = await import('../analysis-chain')

    // Act
    const response = await analyzeDocuments(request)

    // Assert: 구조화된 출력이 포함되어야 함
    const result = response.results[0]
    expect(result.success).toBe(true)
    expect(result.structuredOutput).toBeDefined()
    expect(result.structuredOutput?.summary).toBe('테스트 요약')
    expect(result.structuredOutput?.keywords).toContain('테스트')
  })

  it('EC-04: 대용량 파일 토큰 절단 - truncated 플래그 설정', async () => {
    // Arrange: 모델 컨텍스트 초과하는 대용량 텍스트 (100K 문자)
    const largeDocs: Document[] = [
      {
        pageContent: 'A'.repeat(100_000),
        metadata: { source: 'large.txt' },
      },
    ]

    const mockModel = createMockModel()
    const providers: ProviderConfig[] = [
      { name: 'TestProvider', model: mockModel as unknown as ProviderConfig['model'] },
    ]
    const request: AnalysisRequest = {
      documents: largeDocs,
      providers,
    }

    const { analyzeDocuments } = await import('../analysis-chain')

    // Act
    const response = await analyzeDocuments(request)

    // Assert: truncated 플래그가 true이어야 함
    expect(response.truncated).toBe(true)
  })

  it('분석 결과에 content 또는 structuredOutput이 포함되어야 함', async () => {
    // Arrange
    const mockModel = createMockModel()
    const providers: ProviderConfig[] = [
      { name: 'TestProvider', model: mockModel as unknown as ProviderConfig['model'] },
    ]
    const request: AnalysisRequest = {
      documents: sampleDocs,
      providers,
    }

    const { analyzeDocuments } = await import('../analysis-chain')

    // Act
    const response = await analyzeDocuments(request)

    // Assert
    const result = response.results[0]
    const hasOutput = result.content !== undefined || result.structuredOutput !== undefined
    expect(hasOutput).toBe(true)
  })

  it('제공자 목록이 비어있으면 빈 results 반환', async () => {
    // Arrange
    const request: AnalysisRequest = {
      documents: sampleDocs,
      providers: [],
    }

    const { analyzeDocuments } = await import('../analysis-chain')

    // Act
    const response = await analyzeDocuments(request)

    // Assert
    expect(response.results).toBeInstanceOf(Array)
    expect(response.results.length).toBe(0)
  })
})
