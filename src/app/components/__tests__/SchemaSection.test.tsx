import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SchemaSection } from '../SchemaSection';

describe('SchemaSection', () => {
  // 기본 렌더링 테스트
  it('textarea와 레이블을 렌더링한다', () => {
    render(<SchemaSection value="" onChange={vi.fn()} />);
    // JSON Schema 레이블 확인
    expect(screen.getByLabelText('JSON Schema')).toBeInTheDocument();
    // textarea가 화면에 표시됨
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  // 값 표시 테스트
  it('전달된 value가 textarea에 표시된다', () => {
    const testValue = '{"type": "object"}';
    render(<SchemaSection value={testValue} onChange={vi.fn()} />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(testValue);
  });

  // onChange 콜백 테스트
  it('textarea 변경 시 onChange 콜백이 호출된다', () => {
    const mockOnChange = vi.fn();
    render(<SchemaSection value="" onChange={mockOnChange} />);
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '{"test": 1}' } });
    expect(mockOnChange).toHaveBeenCalledWith('{"test": 1}');
  });

  // 유효한 JSON 입력 테스트
  it('유효한 JSON 입력 시 에러가 표시되지 않는다', () => {
    const validJSON = '{"type": "object", "properties": {}}';
    render(<SchemaSection value={validJSON} onChange={vi.fn()} />);
    // 에러 메시지가 없어야 함
    expect(
      screen.queryByText('유효하지 않은 JSON 형식입니다. 구문을 확인해주세요.'),
    ).not.toBeInTheDocument();
  });

  // 빈 문자열 테스트
  it('빈 값일 때 에러가 표시되지 않는다', () => {
    render(<SchemaSection value="" onChange={vi.fn()} />);
    expect(
      screen.queryByText('유효하지 않은 JSON 형식입니다. 구문을 확인해주세요.'),
    ).not.toBeInTheDocument();
  });

  // 잘못된 JSON 입력 테스트
  it('잘못된 JSON 입력 시 에러 Alert가 표시된다', () => {
    const invalidJSON = '{ invalid json }';
    render(<SchemaSection value={invalidJSON} onChange={vi.fn()} />);
    // Alert가 화면에 나타나야 함
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  // 에러 메시지 한국어 확인
  it('잘못된 JSON 입력 시 한국어 에러 메시지가 표시된다', () => {
    const invalidJSON = 'not valid json';
    render(<SchemaSection value={invalidJSON} onChange={vi.fn()} />);
    expect(
      screen.getByText('유효하지 않은 JSON 형식입니다. 구문을 확인해주세요.'),
    ).toBeInTheDocument();
  });
});
