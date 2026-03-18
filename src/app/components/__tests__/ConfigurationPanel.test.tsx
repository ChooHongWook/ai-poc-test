import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfigurationPanel, type AIProvider } from "../ConfigurationPanel";

// 기본 비활성 프로바이더 팩토리
const disabledProvider = (model = ""): AIProvider => ({
  enabled: false,
  apiKey: "",
  model,
});

// 활성 프로바이더 팩토리
const enabledProvider = (model: string): AIProvider => ({
  enabled: true,
  apiKey: "test-key",
  model,
});

// 기본 ConfigurationPanel 렌더링 헬퍼
const renderPanel = (overrides?: {
  chatgpt?: AIProvider;
  gemini?: AIProvider;
  claude?: AIProvider;
  onChatGPTChange?: ReturnType<typeof vi.fn>;
  onGeminiChange?: ReturnType<typeof vi.fn>;
  onClaudeChange?: ReturnType<typeof vi.fn>;
}) => {
  const props = {
    chatgpt: disabledProvider(),
    gemini: disabledProvider(),
    claude: disabledProvider(),
    onChatGPTChange: vi.fn(),
    onGeminiChange: vi.fn(),
    onClaudeChange: vi.fn(),
    ...overrides,
  };
  return { ...render(<ConfigurationPanel {...props} />), ...props };
};

describe("ConfigurationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 3개 프로바이더 섹션 렌더링 테스트
  it("ChatGPT, Gemini, Claude 세 프로바이더 섹션이 렌더링된다", () => {
    renderPanel();
    expect(screen.getByText(/ChatGPT/)).toBeInTheDocument();
    expect(screen.getByText(/Gemini/)).toBeInTheDocument();
    expect(screen.getByText(/Claude/)).toBeInTheDocument();
  });

  // 비활성 상태에서 API Key 입력 미표시 테스트
  it("체크박스 비활성 상태에서 API Key 입력이 표시되지 않는다", () => {
    renderPanel();
    // 비활성 상태에서는 API Key 입력 필드가 없어야 함
    expect(screen.queryByLabelText("API Key")).not.toBeInTheDocument();
  });

  // 체크박스 클릭 시 onChange 호출 테스트
  it("ChatGPT 체크박스 클릭 시 onChatGPTChange가 enabled: true로 호출된다", async () => {
    const user = userEvent.setup();
    const mockOnChatGPTChange = vi.fn();
    renderPanel({ onChatGPTChange: mockOnChatGPTChange });

    // ChatGPT 체크박스 클릭
    const checkbox = screen.getByRole("checkbox", { name: /ChatGPT/i });
    await user.click(checkbox);

    expect(mockOnChatGPTChange).toHaveBeenCalledOnce();
    const calledWith = mockOnChatGPTChange.mock.calls[0][0];
    expect(calledWith.enabled).toBe(true);
  });

  // API Key 입력 필드 password 타입 확인 테스트
  it("활성화 시 API Key 입력 필드가 password 타입이다", () => {
    renderPanel({
      chatgpt: enabledProvider("gpt-4"),
    });
    // password 타입 input이 하나 이상 있어야 함
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    expect(passwordInputs.length).toBeGreaterThanOrEqual(1);
  });

  // 모델 선택 드롭다운 확인 테스트
  it("ChatGPT 활성화 시 모델 선택 드롭다운이 표시된다", () => {
    renderPanel({
      chatgpt: enabledProvider("gpt-4"),
    });
    // 모델 선택 레이블이 표시되어야 함
    expect(screen.getByText("모델 선택")).toBeInTheDocument();
  });

  // Gemini 체크박스 클릭 테스트
  it("Gemini 체크박스 클릭 시 onGeminiChange가 호출된다", async () => {
    const user = userEvent.setup();
    const mockOnGeminiChange = vi.fn();
    renderPanel({ onGeminiChange: mockOnGeminiChange });

    const checkbox = screen.getByRole("checkbox", { name: /Gemini/i });
    await user.click(checkbox);

    expect(mockOnGeminiChange).toHaveBeenCalledOnce();
    expect(mockOnGeminiChange.mock.calls[0][0].enabled).toBe(true);
  });

  // Claude 체크박스 클릭 테스트
  it("Claude 체크박스 클릭 시 onClaudeChange가 호출된다", async () => {
    const user = userEvent.setup();
    const mockOnClaudeChange = vi.fn();
    renderPanel({ onClaudeChange: mockOnClaudeChange });

    const checkbox = screen.getByRole("checkbox", { name: /Claude/i });
    await user.click(checkbox);

    expect(mockOnClaudeChange).toHaveBeenCalledOnce();
    expect(mockOnClaudeChange.mock.calls[0][0].enabled).toBe(true);
  });
});
