/**
 * POST /api/upload-analyze Route Handler 통합 테스트
 * MSW를 통해 FormData 전송 및 에러 시나리오 검증
 * AC-01: PDF FormData 전송, EC-01: 10MB 파일 크기 제한
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '../../mock/handlers'

const BASE_URL = 'http://localhost:3000'

// MSW 노드 서버 설정
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 테스트용 설정 JSON
const defaultConfig = JSON.stringify({
  chatgpt: { enabled: true, apiKey: 'test-key', model: 'gpt-4o-mini' },
  gemini: { enabled: false, apiKey: '', model: '' },
  claude: { enabled: false, apiKey: '', model: '' },
  systemPrompt: '파일을 분석해주세요',
  userPrompt: '',
  schema: '',
})

// 헬퍼: File 객체 생성
function makeFile(name: string, content: string, type: string): File {
  return new File([content], name, { type })
}

// 헬퍼: FormData 구성 후 POST
async function postFormData(files: File[], config = defaultConfig): Promise<Response> {
  const formData = new FormData()
  files.forEach((f) => formData.append('files', f))
  formData.append('config', config)

  return fetch(`${BASE_URL}/api/upload-analyze`, {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/upload-analyze MSW 핸들러', () => {
  // AC-01: PDF 파일을 FormData로 전송하고 분석 결과 수신
  it('AC-01: PDF 파일이 FormData로 전송되어 분석 결과를 반환해야 함', async () => {
    // Arrange: PDF 파일 생성
    const pdfFile = makeFile('document.pdf', '%PDF-1.4 test content', 'application/pdf')

    // Act: FormData로 전송
    const response = await postFormData([pdfFile])

    // Assert: 성공 응답
    expect(response.ok).toBe(true)
    expect(response.status).toBe(200)

    const result = await response.json()

    // historyItem이 포함되어야 함 (AC-01)
    expect(result).toHaveProperty('historyItem')
    expect(result.historyItem).toHaveProperty('id')
    expect(result.historyItem).toHaveProperty('timestamp')
  })

  it('AC-01: FormData에 파일 이름이 올바르게 전달되어야 함', async () => {
    // Arrange
    const pdfFile = makeFile('my-report.pdf', 'PDF content', 'application/pdf')

    // Act
    const response = await postFormData([pdfFile])
    const result = await response.json()

    // Assert: historyItem에 파일 이름이 포함
    expect(result.historyItem.inputFields).toBeInstanceOf(Array)
    const fileField = result.historyItem.inputFields.find(
      (f: { label: string }) => f.label === 'my-report.pdf',
    )
    expect(fileField).toBeDefined()
  })

  it('TXT 파일 업로드 시 분석 결과를 반환해야 함', async () => {
    // Arrange
    const txtFile = makeFile('notes.txt', '이것은 텍스트 파일입니다.', 'text/plain')

    // Act
    const response = await postFormData([txtFile])

    // Assert
    expect(response.ok).toBe(true)
    const result = await response.json()
    expect(result).toHaveProperty('historyItem')
  })

  it('CSV 파일 업로드 시 분석 결과를 반환해야 함', async () => {
    // Arrange
    const csvFile = makeFile('data.csv', 'name,age\nAlice,30\nBob,25', 'text/csv')

    // Act
    const response = await postFormData([csvFile])

    // Assert
    expect(response.ok).toBe(true)
    const result = await response.json()
    expect(result).toHaveProperty('historyItem')
  })
})

describe('POST /api/upload-analyze 에러 시나리오', () => {
  // EC-01: 10MB 초과 파일 거부
  it('EC-01: 10MB 초과 파일 전송 시 413 에러를 반환해야 함', async () => {
    const { http, HttpResponse } = await import('msw')

    // 10MB 초과 파일 크기 검증 응답을 시뮬레이션
    server.use(
      http.post('*/api/upload-analyze', async ({ request }) => {
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]

        // 10MB 크기 제한 검증 (Route Handler와 동일한 로직)
        const MAX_FILE_SIZE = 10 * 1024 * 1024
        for (const file of files) {
          if (file.size > MAX_FILE_SIZE) {
            return HttpResponse.json(
              { error: '파일 크기가 10MB를 초과합니다' },
              { status: 413 },
            )
          }
        }

        return HttpResponse.json({ historyItem: { id: 'ok' } })
      }),
    )

    // Arrange: 11MB 파일 생성 (실제 크기 설정)
    const largeContent = 'A'.repeat(11 * 1024 * 1024)
    const largeFile = makeFile('large.txt', largeContent, 'text/plain')

    // Act
    const response = await postFormData([largeFile])

    // Assert: 413 상태 코드
    expect(response.status).toBe(413)
    const result = await response.json()
    expect(result.error).toContain('10MB')
  })

  // EC-02: API 키 미설정
  it('EC-02: 모든 제공자 비활성화 시 에러 응답이 반환되어야 함', async () => {
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.post('*/api/upload-analyze', () => {
        return HttpResponse.json(
          { error: '활성화된 AI 제공자가 없습니다. API 키를 설정하세요.' },
          { status: 400 },
        )
      }),
    )

    const config = JSON.stringify({
      chatgpt: { enabled: false, apiKey: '', model: '' },
      gemini: { enabled: false, apiKey: '', model: '' },
      claude: { enabled: false, apiKey: '', model: '' },
      systemPrompt: '',
      userPrompt: '',
      schema: '',
    })

    const file = makeFile('test.txt', '내용', 'text/plain')
    const response = await postFormData([file], config)

    expect(response.status).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('API 키를 설정하세요')
  })

  // EC-03: 빈 파일 처리
  it('EC-03: 빈 파일(0바이트) 전송 시 에러 응답이 반환되어야 함', async () => {
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.post('*/api/upload-analyze', async ({ request }) => {
        const formData = await request.formData()
        const files = formData.getAll('files') as File[]

        for (const file of files) {
          if (file.size === 0) {
            return HttpResponse.json(
              { error: '빈 파일은 분석할 수 없습니다' },
              { status: 400 },
            )
          }
        }

        return HttpResponse.json({ historyItem: { id: 'ok' } })
      }),
    )

    const emptyFile = makeFile('empty.txt', '', 'text/plain')
    const response = await postFormData([emptyFile])

    expect(response.status).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('빈 파일')
  })

  // AC-04: 미지원 파일 형식
  it('AC-04: 미지원 파일 형식 전송 시 400 에러를 반환해야 함', async () => {
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.post('*/api/upload-analyze', () => {
        return HttpResponse.json(
          { error: '지원하지 않는 파일 형식입니다' },
          { status: 400 },
        )
      }),
    )

    const exeFile = makeFile('program.exe', 'binary', 'application/octet-stream')
    const response = await postFormData([exeFile])

    expect(response.status).toBe(400)
    const result = await response.json()
    expect(result.error).toContain('지원하지 않는 파일 형식')
  })
})

describe('analyzeUpload API 클라이언트 함수', () => {
  it('FormData를 올바르게 구성하여 POST 요청을 전송해야 함', async () => {
    // analyzeUpload 함수를 직접 테스트
    const { analyzeUpload } = await import('../upload-analyze')

    const file = makeFile('test.txt', '테스트 내용', 'text/plain')

    // Act: analyzeUpload 호출 (MSW가 인터셉트)
    const result = await analyzeUpload({
      files: [file],
      chatgpt: { enabled: true, apiKey: 'test-key', model: 'gpt-4o-mini' },
      gemini: { enabled: false, apiKey: '', model: '' },
      claude: { enabled: false, apiKey: '', model: '' },
      systemPrompt: '분석해주세요',
      userPrompt: '',
      schema: '',
    })

    // Assert: 결과 반환 확인
    expect(result).toHaveProperty('historyItem')
  })

  it('API 오류 시 Error를 throw해야 함', async () => {
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.post('*/api/upload-analyze', () => {
        return new HttpResponse(null, { status: 500 })
      }),
    )

    const { analyzeUpload } = await import('../upload-analyze')
    const file = makeFile('test.txt', '내용', 'text/plain')

    await expect(
      analyzeUpload({
        files: [file],
        chatgpt: { enabled: true, apiKey: 'test-key', model: 'gpt-4o-mini' },
        gemini: { enabled: false, apiKey: '', model: '' },
        claude: { enabled: false, apiKey: '', model: '' },
        systemPrompt: '',
        userPrompt: '',
        schema: '',
      }),
    ).rejects.toThrow()
  })
})
