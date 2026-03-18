import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InputDataSection } from "../InputDataSection";

// 테스트용 기본 필드 데이터
const mockFields = [
  { id: "1", label: "고객명", value: "홍길동" },
  { id: "2", label: "날짜", value: "2024-01-01" },
];

describe("InputDataSection", () => {
  // 초기 렌더링 테스트
  it("'입력 데이터' 제목이 표시된다", () => {
    render(<InputDataSection inputFields={[]} onInputFieldsChange={vi.fn()} />);
    expect(screen.getByText("입력 데이터")).toBeInTheDocument();
  });

  // 빈 상태 메시지 테스트
  it("필드가 없을 때 빈 상태 메시지를 표시한다", () => {
    render(<InputDataSection inputFields={[]} onInputFieldsChange={vi.fn()} />);
    expect(screen.getByText("위에서 필드를 추가해주세요")).toBeInTheDocument();
  });

  // 필드 추가 테스트
  it("새 필드 이름 입력 후 추가 버튼 클릭 시 onInputFieldsChange가 호출된다", async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();
    render(<InputDataSection inputFields={[]} onInputFieldsChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("새 필드 이름 (예: 고객명, 날짜)");
    await user.type(input, "프로젝트명");

    // Plus 버튼 클릭
    const addButton = screen.getByRole("button");
    await user.click(addButton);

    expect(mockOnChange).toHaveBeenCalledOnce();
    // 새 필드가 추가된 배열이 전달되어야 함
    const calledWith = mockOnChange.mock.calls[0][0];
    expect(calledWith[0].label).toBe("프로젝트명");
  });

  // 빈 라벨 필드 추가 시도 테스트
  it("빈 라벨로 필드 추가 시도 시 추가되지 않는다", async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();
    render(<InputDataSection inputFields={[]} onInputFieldsChange={mockOnChange} />);

    // 라벨 없이 바로 추가 버튼 클릭
    const addButton = screen.getByRole("button");
    await user.click(addButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  // 필드 목록 표시 테스트
  it("inputFields 배열의 필드들이 렌더링된다", () => {
    render(<InputDataSection inputFields={mockFields} onInputFieldsChange={vi.fn()} />);
    // 레이블이 표시되어야 함
    expect(screen.getByText("고객명")).toBeInTheDocument();
    expect(screen.getByText("날짜")).toBeInTheDocument();
  });

  // 필드 삭제 테스트
  it("삭제 버튼 클릭 시 해당 필드가 제거된다", async () => {
    const mockOnChange = vi.fn();
    const user = userEvent.setup();
    render(<InputDataSection inputFields={mockFields} onInputFieldsChange={mockOnChange} />);

    // 삭제 버튼들 중 첫 번째 클릭 (Trash2 아이콘이 있는 버튼)
    const deleteButtons = screen.getAllByRole("button");
    // 마지막 버튼은 추가 버튼이고 나머지는 삭제 버튼
    // 필드 삭제 버튼은 필드 목록에 있음
    await user.click(deleteButtons[deleteButtons.length - 2]); // 첫 번째 필드의 삭제 버튼

    expect(mockOnChange).toHaveBeenCalledOnce();
    const calledWith = mockOnChange.mock.calls[0][0];
    // 한 개의 필드가 제거되어야 함
    expect(calledWith).toHaveLength(1);
  });

  // 필드 값 수정 테스트
  it("필드 값 변경 시 onInputFieldsChange가 호출된다", async () => {
    const mockOnChange = vi.fn();
    render(<InputDataSection inputFields={mockFields} onInputFieldsChange={mockOnChange} />);

    // 필드의 input 요소 찾기 (id로 찾기)
    const fieldInput = screen.getByDisplayValue("홍길동");
    fireEvent.change(fieldInput, { target: { value: "김철수" } });

    expect(mockOnChange).toHaveBeenCalledOnce();
    const calledWith = mockOnChange.mock.calls[0][0];
    expect(calledWith[0].value).toBe("김철수");
  });

  // JSON 탭 표시 테스트
  it("JSON 보기 탭에서 필드를 JSON으로 표시한다", async () => {
    const user = userEvent.setup();
    render(<InputDataSection inputFields={mockFields} onInputFieldsChange={vi.fn()} />);

    // JSON 보기 탭 클릭
    const jsonTab = screen.getByRole("tab", { name: "JSON 보기" });
    await user.click(jsonTab);

    // JSON 내용이 표시되어야 함
    expect(screen.getByText(/"고객명"/)).toBeInTheDocument();
    expect(screen.getByText(/"홍길동"/)).toBeInTheDocument();
  });
});
