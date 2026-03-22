// AI Provider Factory 단위 테스트
// RED 단계: ai-provider-factory.ts 구현 전 - 테스트 실패 예상
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('createProviders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // 환경변수 초기화
    delete process.env.OPENAI_API_KEY
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
  })

  it('OPENAI_API_KEY가 설정되면 ChatOpenAI 제공자 반환', async () => {
    // Arrange
    process.env.OPENAI_API_KEY = 'test-openai-key'

    const { createProviders } = await import('../ai-provider-factory')

    // Act
    const providers = createProviders()

    // Assert: ChatOpenAI 제공자가 포함되어야 함
    expect(providers).toBeInstanceOf(Array)
    expect(providers.length).toBeGreaterThan(0)
    const providerNames = providers.map((p) => p.name)
    expect(providerNames).toContain('ChatOpenAI')
  })

  it('GOOGLE_GENERATIVE_AI_API_KEY가 설정되면 ChatGoogleGenerativeAI 제공자 반환', async () => {
    // Arrange
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'

    const { createProviders } = await import('../ai-provider-factory')

    // Act
    const providers = createProviders()

    // Assert
    const providerNames = providers.map((p) => p.name)
    expect(providerNames).toContain('ChatGoogleGenerativeAI')
  })

  it('ANTHROPIC_API_KEY가 설정되면 ChatAnthropic 제공자 반환', async () => {
    // Arrange
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

    const { createProviders } = await import('../ai-provider-factory')

    // Act
    const providers = createProviders()

    // Assert
    const providerNames = providers.map((p) => p.name)
    expect(providerNames).toContain('ChatAnthropic')
  })

  it('API 키가 하나도 설정되지 않으면 빈 배열 반환', async () => {
    // Arrange: 모든 API 키 제거 (afterEach에서 처리)

    const { createProviders } = await import('../ai-provider-factory')

    // Act
    const providers = createProviders()

    // Assert: 빈 배열 반환 (EC-02에서 상위 레이어에서 에러 처리)
    expect(providers).toBeInstanceOf(Array)
    expect(providers.length).toBe(0)
  })

  it('복수의 API 키가 설정되면 복수의 제공자 반환', async () => {
    // Arrange
    process.env.OPENAI_API_KEY = 'test-openai-key'
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'test-google-key'
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key'

    const { createProviders } = await import('../ai-provider-factory')

    // Act
    const providers = createProviders()

    // Assert: 3개의 제공자 반환
    expect(providers.length).toBe(3)
  })

  it('각 제공자는 name과 model 프로퍼티를 가져야 함', async () => {
    // Arrange
    process.env.OPENAI_API_KEY = 'test-openai-key'

    const { createProviders } = await import('../ai-provider-factory')

    // Act
    const providers = createProviders()

    // Assert: ProviderConfig 인터페이스 충족
    for (const provider of providers) {
      expect(provider).toHaveProperty('name')
      expect(provider).toHaveProperty('model')
      expect(typeof provider.name).toBe('string')
      expect(provider.model).toBeDefined()
    }
  })
})
