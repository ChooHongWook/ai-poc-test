// LangChain.js 문서 로더 - Buffer를 Document[]로 변환
// @MX:ANCHOR: 모든 파일 분석 요청의 진입점 함수
// @MX:REASON: analysis-chain, API 라우트 핸들러 등 복수 위치에서 참조

import { Document } from '@langchain/core/documents'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv'
import type { FileAnalysisInput } from './types'
import { UnsupportedFileTypeError } from './types'

/**
 * 파일 입력을 LangChain Document 배열로 변환
 * Buffer를 Blob으로 변환 후 적절한 로더 사용
 */
export async function loadDocument(input: FileAnalysisInput): Promise<Document[]> {
  const { buffer, mimeType, fileName } = input

  // 빈 파일 검증
  if (buffer.length === 0) {
    throw new Error('빈 파일은 처리할 수 없습니다')
  }

  switch (mimeType) {
    case 'application/pdf': {
      // Buffer를 Blob으로 변환 후 PDFLoader에 전달
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
      const loader = new PDFLoader(blob)
      return loader.load()
    }

    case 'text/csv': {
      // Buffer를 Blob으로 변환 후 CSVLoader에 전달
      const blob = new Blob([new Uint8Array(buffer)], { type: mimeType })
      const loader = new CSVLoader(blob)
      return loader.load()
    }

    case 'text/plain':
    case 'text/markdown': {
      // TXT/MD는 Document를 직접 생성 (로더 불필요)
      const content = buffer.toString('utf-8')
      return [
        new Document({
          pageContent: content,
          metadata: { source: fileName, mimeType },
        }),
      ]
    }

    default:
      throw new UnsupportedFileTypeError(mimeType)
  }
}
