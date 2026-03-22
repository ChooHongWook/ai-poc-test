import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OutputDataSection, type AIOutput } from '../OutputDataSection';

// sonner toast 목 처리
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

// export-utils 목 처리
vi.mock('@/lib/export-utils', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(true),
  downloadJSON: vi.fn(),
  downloadCSV: vi.fn(),
  downloadMarkdown: vi.fn(),
}));

// 빈 출력 데이터 팩토리
const emptyOutput = (): AIOutput => ({
  data: {},
  generated: false,
});

// 생성된 출력 데이터 팩토리
const generatedOutput = (data: Record<string, string>): AIOutput => ({
  data,
  generated: true,
});

// 기본 활성화된 프로바이더
const allEnabled = { chatgpt: true, gemini: true, claude: true };
const allDisabled = { chatgpt: false, gemini: false, claude: false };

describe('OutputDataSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 비활성화 상태 테스트
  it("프로바이더가 비활성화되면 '비활성화' 배지가 표시된다", () => {
    render(
      <OutputDataSection
        chatgptOutput={emptyOutput()}
        geminiOutput={emptyOutput()}
        claudeOutput={emptyOutput()}
        enabledProviders={allDisabled}
      />,
    );
    // 세 프로바이더 모두 비활성화 배지가 표시되어야 함
    const badges = screen.getAllByText('비활성화');
    expect(badges).toHaveLength(3);
  });

  // 활성 상태이지만 미생성 테스트
  it("활성화되었지만 생성되지 않은 경우 '결과를 기다리는 중' 메시지가 표시된다", () => {
    render(
      <OutputDataSection
        chatgptOutput={emptyOutput()}
        geminiOutput={emptyOutput()}
        claudeOutput={emptyOutput()}
        enabledProviders={allEnabled}
      />,
    );
    // 세 프로바이더 모두 대기 메시지가 있어야 함
    const waitingMessages = screen.getAllByText(/결과를 기다리는 중/);
    expect(waitingMessages.length).toBeGreaterThanOrEqual(1);
  });

  // 생성 완료 배지 테스트
  it("출력이 생성된 경우 '생성 완료' 배지가 표시된다", () => {
    render(
      <OutputDataSection
        chatgptOutput={generatedOutput({ 제목: '테스트 결과' })}
        geminiOutput={emptyOutput()}
        claudeOutput={emptyOutput()}
        enabledProviders={allEnabled}
      />,
    );
    expect(screen.getByText('생성 완료')).toBeInTheDocument();
  });

  // 필드 데이터 표시 테스트
  it('생성된 출력의 필드 데이터가 표시된다', () => {
    render(
      <OutputDataSection
        chatgptOutput={generatedOutput({
          제목: '테스트 제목',
          내용: '테스트 내용',
        })}
        geminiOutput={emptyOutput()}
        claudeOutput={emptyOutput()}
        enabledProviders={allEnabled}
      />,
    );
    // 필드 키와 값이 표시되어야 함
    expect(screen.getByText('제목')).toBeInTheDocument();
    expect(screen.getByDisplayValue('테스트 제목')).toBeInTheDocument();
  });

  // JSON 탭 표시 테스트
  it('JSON 탭에서 JSON 형식으로 데이터가 표시된다', async () => {
    const user = userEvent.setup();
    render(
      <OutputDataSection
        chatgptOutput={generatedOutput({ 제목: 'JSON 테스트' })}
        geminiOutput={emptyOutput()}
        claudeOutput={emptyOutput()}
        enabledProviders={{ chatgpt: true, gemini: false, claude: false }}
      />,
    );

    // JSON 보기 탭 클릭
    const jsonTabs = screen.getAllByRole('tab', { name: 'JSON 보기' });
    await user.click(jsonTabs[0]);

    // JSON 내용 확인
    expect(screen.getByText(/"제목"/)).toBeInTheDocument();
    expect(screen.getByText(/"JSON 테스트"/)).toBeInTheDocument();
  });

  // 3개 프로바이더 렌더링 테스트
  it('ChatGPT, Gemini, Claude 세 프로바이더가 모두 렌더링된다', () => {
    render(
      <OutputDataSection
        chatgptOutput={emptyOutput()}
        geminiOutput={emptyOutput()}
        claudeOutput={emptyOutput()}
        enabledProviders={allEnabled}
      />,
    );
    // 세 프로바이더 제목이 모두 표시되어야 함
    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    expect(screen.getByText('Gemini')).toBeInTheDocument();
    expect(screen.getByText('Claude')).toBeInTheDocument();
  });
});
