// 내보내기 유틸리티 단위 테스트
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  copyToClipboard,
  downloadJSON,
  downloadCSV,
  downloadMarkdown,
  type ExportData,
} from "../export-utils";

// 테스트용 내보내기 데이터 픽스처
const sampleExportData: ExportData = {
  chatgpt: { title: "ChatGPT 제목", description: "ChatGPT 설명" },
  gemini: { title: "Gemini 제목", description: "Gemini 설명" },
  claude: { title: "Claude 제목", description: "Claude 설명" },
  metadata: {
    generatedAt: "2024-01-01T12:00:00.000Z",
    systemPrompt: "시스템 프롬프트",
    userPrompt: "사용자 프롬프트",
  },
};

describe("copyToClipboard", () => {
  beforeEach(() => {
    // navigator.clipboard 목 설정
    Object.defineProperty(navigator, "clipboard", {
      writable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("navigator.clipboard.writeText를 호출해야 한다", async () => {
    // writeText 호출 여부 확인
    await copyToClipboard({ test: "data" });
    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
  });

  it("성공 시 true를 반환해야 한다", async () => {
    // 성공 케이스
    const result = await copyToClipboard({ test: "data" });
    expect(result).toBe(true);
  });

  it("clipboard writeText가 실패하면 false를 반환해야 한다", async () => {
    // writeText가 에러를 던지는 경우
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("Clipboard access denied")
    );
    const result = await copyToClipboard({ test: "data" });
    expect(result).toBe(false);
  });

  it("JSON.stringify로 직렬화된 문자열이 전달되어야 한다", async () => {
    // 전달되는 텍스트 내용 확인
    const data = { key: "value" };
    await copyToClipboard(data);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(data, null, 2)
    );
  });
});

describe("downloadJSON", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let anchorClickMock: ReturnType<typeof vi.fn>;
  let createdAnchor: HTMLAnchorElement;

  beforeEach(() => {
    // URL 객체 목 설정
    createObjectURLMock = vi.fn().mockReturnValue("blob:http://localhost/mock-url");
    revokeObjectURLMock = vi.fn();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;

    // document.createElement('a') 목 설정
    anchorClickMock = vi.fn();
    createdAnchor = {
      href: "",
      download: "",
      click: anchorClickMock,
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") return createdAnchor;
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Blob이 생성되어야 한다", () => {
    // JSON 다운로드 시 Blob 생성 확인
    downloadJSON(sampleExportData);
    expect(createObjectURLMock).toHaveBeenCalledOnce();
    // createObjectURL에 Blob이 전달되어야 함
    const callArg = createObjectURLMock.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(Blob);
  });

  it("URL.createObjectURL이 호출되어야 한다", () => {
    downloadJSON(sampleExportData);
    expect(createObjectURLMock).toHaveBeenCalled();
  });

  it("커스텀 파일명이 다운로드에 사용되어야 한다", () => {
    // filename 파라미터 전달 시 해당 이름 사용
    downloadJSON(sampleExportData, "my-export.json");
    expect(createdAnchor.download).toBe("my-export.json");
  });

  it("링크 클릭이 실행되어야 한다", () => {
    downloadJSON(sampleExportData);
    expect(anchorClickMock).toHaveBeenCalled();
  });
});

describe("downloadCSV", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let capturedBlob: Blob | null = null;
  let createdAnchor: HTMLAnchorElement;

  beforeEach(() => {
    capturedBlob = null;
    createObjectURLMock = vi.fn().mockImplementation((blob: Blob) => {
      // Blob 내용을 캡처
      capturedBlob = blob;
      return "blob:http://localhost/mock-url";
    });
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = vi.fn();

    createdAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") return createdAnchor;
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("BOM(\\uFEFF)이 포함된 CSV를 생성해야 한다", async () => {
    // BOM 포함 여부를 Blob 바이트에서 직접 확인
    // UTF-8 BOM은 바이트 시퀀스 0xEF 0xBB 0xBF
    downloadCSV(sampleExportData);
    expect(capturedBlob).not.toBeNull();
    const buffer = await capturedBlob!.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // UTF-8 BOM 바이트 시퀀스 확인
    expect(bytes[0]).toBe(0xEF);
    expect(bytes[1]).toBe(0xBB);
    expect(bytes[2]).toBe(0xBF);
  });

  it("쉼표가 포함된 셀 값은 따옴표로 감싸야 한다", async () => {
    // 쉼표 이스케이프 테스트
    const dataWithComma: ExportData = {
      chatgpt: { title: "제목, 부제목" },
    };
    downloadCSV(dataWithComma);
    const text = await capturedBlob!.text();
    // 쉼표 포함 값은 따옴표로 감싸져야 함
    expect(text).toContain('"제목, 부제목"');
  });

  it("따옴표가 포함된 셀 값은 이스케이프 처리해야 한다", async () => {
    // 따옴표 이스케이프 테스트
    const dataWithQuote: ExportData = {
      chatgpt: { title: 'He said "hello"' },
    };
    downloadCSV(dataWithQuote);
    const text = await capturedBlob!.text();
    // 따옴표는 이중 따옴표로 이스케이프되어야 함
    expect(text).toContain('"He said ""hello"""');
  });

  it("헤더 행에 provider 컬럼이 포함되어야 한다", async () => {
    downloadCSV(sampleExportData);
    const text = await capturedBlob!.text();
    // BOM 제거 후 첫 번째 줄이 헤더
    const withoutBom = text.replace("\uFEFF", "");
    const firstLine = withoutBom.split("\n")[0];
    expect(firstLine).toContain("provider");
  });
});

describe("downloadMarkdown", () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let capturedBlob: Blob | null = null;
  let createdAnchor: HTMLAnchorElement;

  beforeEach(() => {
    capturedBlob = null;
    createObjectURLMock = vi.fn().mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return "blob:http://localhost/mock-url";
    });
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = vi.fn();

    createdAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName === "a") return createdAnchor;
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("마크다운 헤더(#)가 포함되어야 한다", async () => {
    // H1 헤더 포함 여부 확인
    downloadMarkdown(sampleExportData);
    const text = await capturedBlob!.text();
    expect(text).toContain("# AI 문서 생성 결과");
  });

  it("테이블 형식(| 컬럼 |)이 포함되어야 한다", async () => {
    // 마크다운 테이블 포함 여부 확인
    downloadMarkdown(sampleExportData);
    const text = await capturedBlob!.text();
    // 테이블 헤더와 구분선 포함
    expect(text).toContain("| 항목 | 내용 |");
    expect(text).toContain("| --- | --- |");
  });

  it("메타데이터 섹션이 포함되어야 한다", async () => {
    // 생성 정보 섹션 포함 여부 확인
    downloadMarkdown(sampleExportData);
    const text = await capturedBlob!.text();
    expect(text).toContain("## 생성 정보");
    expect(text).toContain("2024-01-01T12:00:00.000Z");
  });

  it("각 프로바이더 결과 섹션이 포함되어야 한다", async () => {
    // 프로바이더별 섹션 헤더 포함 여부
    downloadMarkdown(sampleExportData);
    const text = await capturedBlob!.text();
    expect(text).toContain("## ChatGPT 결과");
    expect(text).toContain("## Gemini 결과");
    expect(text).toContain("## Claude 결과");
  });

  it("커스텀 파일명이 지정되면 해당 이름을 사용해야 한다", () => {
    downloadMarkdown(sampleExportData, "my-result.md");
    expect(createdAnchor.download).toBe("my-result.md");
  });
});
