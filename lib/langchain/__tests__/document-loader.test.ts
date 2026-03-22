// Document Loader 단위 테스트
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FileAnalysisInput } from '../types'
import { UnsupportedFileTypeError } from '../types'

// LangChain 커뮤니티 PDF 로더 모킹 (class constructor 형태)
vi.mock('@langchain/community/document_loaders/fs/pdf', () => ({
  PDFLoader: vi.fn().mockImplementation(function () {
    return {
      load: vi.fn().mockResolvedValue([
        { pageContent: 'PDF 문서 내용', metadata: { source: 'test.pdf' } },
      ]),
    }
  }),
}))

// LangChain 커뮤니티 CSV 로더 모킹 (class constructor 형태)
vi.mock('@langchain/community/document_loaders/fs/csv', () => ({
  CSVLoader: vi.fn().mockImplementation(function () {
    return {
      load: vi.fn().mockResolvedValue([
        { pageContent: 'column1: value1\ncolumn2: value2', metadata: { source: 'test.csv' } },
      ]),
    }
  }),
}))

describe('loadDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PDF 파일을 로드하면 Document[] 반환', async () => {
    const { loadDocument } = await import('../document-loader')
    const input: FileAnalysisInput = {
      buffer: Buffer.from('%PDF-1.4 fake content'),
      mimeType: 'application/pdf',
      fileName: 'test.pdf',
    }

    const docs = await loadDocument(input)

    expect(docs).toBeInstanceOf(Array)
    expect(docs.length).toBeGreaterThan(0)
    expect(docs[0]).toHaveProperty('pageContent')
  })

  it('CSV 파일을 로드하면 Document[] 반환', async () => {
    const { loadDocument } = await import('../document-loader')
    const input: FileAnalysisInput = {
      buffer: Buffer.from('name,age\nAlice,30\nBob,25'),
      mimeType: 'text/csv',
      fileName: 'test.csv',
    }

    const docs = await loadDocument(input)

    expect(docs).toBeInstanceOf(Array)
    expect(docs.length).toBeGreaterThan(0)
  })

  it('TXT 파일을 로드하면 Document[] 반환', async () => {
    const { loadDocument } = await import('../document-loader')
    const input: FileAnalysisInput = {
      buffer: Buffer.from('텍스트 파일 내용입니다.'),
      mimeType: 'text/plain',
      fileName: 'test.txt',
    }

    const docs = await loadDocument(input)

    expect(docs).toBeInstanceOf(Array)
    expect(docs.length).toBeGreaterThan(0)
    expect(docs[0].pageContent).toBe('텍스트 파일 내용입니다.')
  })

  it('MD 파일을 로드하면 Document[] 반환 (텍스트로 처리)', async () => {
    const { loadDocument } = await import('../document-loader')
    const input: FileAnalysisInput = {
      buffer: Buffer.from('# 마크다운 제목\n내용입니다.'),
      mimeType: 'text/markdown',
      fileName: 'test.md',
    }

    const docs = await loadDocument(input)

    expect(docs).toBeInstanceOf(Array)
    expect(docs.length).toBeGreaterThan(0)
    expect(docs[0].pageContent).toBe('# 마크다운 제목\n내용입니다.')
  })

  it('지원하지 않는 MIME 타입이면 UnsupportedFileTypeError 발생', async () => {
    const { loadDocument } = await import('../document-loader')
    const input: FileAnalysisInput = {
      buffer: Buffer.from('fake image data'),
      mimeType: 'image/png',
      fileName: 'test.png',
    }

    await expect(loadDocument(input)).rejects.toThrow(UnsupportedFileTypeError)
    await expect(loadDocument(input)).rejects.toThrow('지원하지 않는 파일 형식입니다: image/png')
  })

  it('빈 파일(0바이트)이면 Error 발생', async () => {
    const { loadDocument } = await import('../document-loader')
    const input: FileAnalysisInput = {
      buffer: Buffer.alloc(0),
      mimeType: 'text/plain',
      fileName: 'empty.txt',
    }

    await expect(loadDocument(input)).rejects.toThrow('빈 파일은 처리할 수 없습니다')
  })
})
