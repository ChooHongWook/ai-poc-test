import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileUploadSection } from '../FileUploadSection';

// sonner toast 목 처리
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// file-processor validateFile 목 처리
vi.mock('@/lib/file-processor', () => ({
  validateFile: vi.fn().mockReturnValue({ valid: true }),
}));

// 테스트용 가짜 File 객체 생성 헬퍼
const createMockFile = (name: string, size: number, type: string) =>
  new File(['x'.repeat(Math.min(size, 100))], name, { type });

// 테스트용 UploadedFile 목 데이터
const createMockUploadedFile = (
  id: string,
  name: string,
  size: string,
  type: string,
) => ({
  id,
  file: createMockFile(name, 100, type),
  name,
  size,
  type,
});

describe('FileUploadSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 초기 렌더링 테스트
  it('파일 업로드 영역이 렌더링된다', () => {
    render(<FileUploadSection files={[]} onFilesChange={vi.fn()} />);
    // 업로드 안내 텍스트가 표시되어야 함
    expect(
      screen.getByText('클릭하거나 파일을 드래그하여 업로드'),
    ).toBeInTheDocument();
    expect(screen.getByText(/PDF, DOCX, TXT/)).toBeInTheDocument();
  });

  // 파일 선택 시 onFilesChange 호출 테스트
  it('파일 입력으로 파일 추가 시 onFilesChange가 호출된다', () => {
    const mockOnFilesChange = vi.fn();
    render(<FileUploadSection files={[]} onFilesChange={mockOnFilesChange} />);

    // 숨겨진 file input을 찾아 파일 변경 이벤트 발생
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const mockFile = createMockFile('test.pdf', 1024, 'application/pdf');
    const fileList = {
      0: mockFile,
      length: 1,
      item: (index: number) => (index === 0 ? mockFile : null),
      [Symbol.iterator]: function* () {
        yield mockFile;
      },
    } as unknown as FileList;

    fireEvent.change(fileInput, { target: { files: fileList } });
    expect(mockOnFilesChange).toHaveBeenCalledOnce();
  });

  // 파일 목록 표시 테스트
  it('업로드된 파일 목록이 이름과 크기와 함께 표시된다', () => {
    const mockFiles = [
      createMockUploadedFile('1', 'document.pdf', '1.5 MB', 'application/pdf'),
      createMockUploadedFile('2', 'image.png', '256 KB', 'image/png'),
    ];
    render(<FileUploadSection files={mockFiles} onFilesChange={vi.fn()} />);

    // 파일 이름 표시 확인
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.5 MB')).toBeInTheDocument();
    expect(screen.getByText('image.png')).toBeInTheDocument();
    expect(screen.getByText('256 KB')).toBeInTheDocument();
  });

  // 파일 삭제 테스트
  it('X 버튼으로 파일을 제거할 수 있다', () => {
    const mockOnFilesChange = vi.fn();
    const mockFiles = [
      createMockUploadedFile('1', 'document.pdf', '1.5 MB', 'application/pdf'),
    ];
    render(
      <FileUploadSection files={mockFiles} onFilesChange={mockOnFilesChange} />,
    );

    // X 버튼 클릭 (파일 삭제)
    const deleteButtons = screen.getAllByRole('button');
    // 파일 목록의 버튼 클릭
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);

    expect(mockOnFilesChange).toHaveBeenCalledOnce();
    const calledWith = mockOnFilesChange.mock.calls[0][0];
    // 파일이 제거되어 빈 배열이 되어야 함
    expect(calledWith).toHaveLength(0);
  });

  // 드래그 상태 스타일 변경 테스트
  it('dragover 이벤트 시 드래그 상태가 활성화된다', () => {
    render(<FileUploadSection files={[]} onFilesChange={vi.fn()} />);

    // 업로드 영역 찾기 (dashed border 영역)
    const uploadArea = screen
      .getByText('클릭하거나 파일을 드래그하여 업로드')
      .closest('div');
    expect(uploadArea).toBeInTheDocument();

    // dragover 이벤트 발생
    fireEvent.dragOver(uploadArea!);

    // isDragging 상태가 true가 되면 클래스가 변경됨
    expect(uploadArea).toHaveClass('border-primary');
  });
});
