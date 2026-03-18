"use client";
// 스트리밍 생성 커스텀 훅 - SSE를 통한 실시간 AI 응답 처리

import { useState, useCallback, useRef } from "react";
import type { GenerateRequestConfig, ProviderName } from "@/lib/types";

// 프로바이더별 진행 상태 타입
export type ProviderStatus = "idle" | "loading" | "streaming" | "done" | "error";

// 프로바이더별 출력 데이터 타입
interface StreamOutput {
  data: Record<string, string>;
  generated: boolean;
  streaming: boolean;
  rawText: string;
  error?: string;
}

// 훅 반환 타입
interface UseStreamGenerateReturn {
  outputs: Record<ProviderName, StreamOutput>;
  providerStatus: Record<ProviderName, ProviderStatus>;
  isGenerating: boolean;
  startStreaming: (config: GenerateRequestConfig, files: File[]) => Promise<void>;
  cancelStreaming: (provider?: ProviderName) => void;
  resetOutputs: () => void;
}

// 초기 출력 상태 생성 헬퍼
function createInitialOutput(): StreamOutput {
  return {
    data: {},
    generated: false,
    streaming: false,
    rawText: "",
  };
}

// 초기 출력 상태 맵
const INITIAL_OUTPUTS: Record<ProviderName, StreamOutput> = {
  chatgpt: createInitialOutput(),
  gemini: createInitialOutput(),
  claude: createInitialOutput(),
};

// 초기 프로바이더 상태 맵
const INITIAL_STATUS: Record<ProviderName, ProviderStatus> = {
  chatgpt: "idle",
  gemini: "idle",
  claude: "idle",
};

/**
 * SSE 스트리밍을 통한 AI 생성 훅
 * /api/generate/stream 엔드포인트에서 실시간으로 응답을 수신하고 상태를 업데이트
 */
export function useStreamGenerate(): UseStreamGenerateReturn {
  // 각 프로바이더별 출력 상태
  const [outputs, setOutputs] = useState<Record<ProviderName, StreamOutput>>(
    INITIAL_OUTPUTS
  );

  // 각 프로바이더별 진행 상태
  const [providerStatus, setProviderStatus] = useState<
    Record<ProviderName, ProviderStatus>
  >(INITIAL_STATUS);

  // 전체 생성 중 여부
  const [isGenerating, setIsGenerating] = useState(false);

  // 취소 컨트롤러 ref (AbortController)
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 프로바이더 상태 업데이트 헬퍼
   */
  const updateProviderStatus = useCallback(
    (provider: ProviderName, status: ProviderStatus) => {
      setProviderStatus((prev) => ({ ...prev, [provider]: status }));
    },
    []
  );

  /**
   * 프로바이더 출력 상태 업데이트 헬퍼
   */
  const updateOutput = useCallback(
    (provider: ProviderName, updater: (prev: StreamOutput) => StreamOutput) => {
      setOutputs((prev) => ({
        ...prev,
        [provider]: updater(prev[provider]),
      }));
    },
    []
  );

  /**
   * SSE 스트리밍 시작
   * config와 파일 목록을 받아 /api/generate/stream에 요청 후 SSE 이벤트를 파싱
   */
  const startStreaming = useCallback(
    async (config: GenerateRequestConfig, files: File[]): Promise<void> => {
      // 이전 취소 컨트롤러 중단
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 새 AbortController 생성
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // 상태 초기화
      setOutputs(INITIAL_OUTPUTS);
      setProviderStatus(INITIAL_STATUS);
      setIsGenerating(true);

      // 활성화된 프로바이더를 loading 상태로 초기화
      const enabledProviders = (
        Object.entries(config.providers) as [
          ProviderName,
          { enabled: boolean; apiKey: string; model: string }
        ][]
      )
        .filter(([, p]) => p.enabled && p.apiKey.trim().length > 0)
        .map(([name]) => name);

      enabledProviders.forEach((provider) => {
        updateProviderStatus(provider, "loading");
      });

      try {
        // FormData 구성
        const formData = new FormData();
        formData.append("config", JSON.stringify(config));
        files.forEach((file) => formData.append("files", file));

        // SSE 요청 전송
        const response = await fetch("/api/generate/stream", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`스트리밍 요청 실패: HTTP ${response.status}`);
        }

        // ReadableStream 읽기
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // SSE 이벤트 루프
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 청크를 버퍼에 추가하여 완전한 이벤트 파싱
          buffer += decoder.decode(value, { stream: true });

          // "\n\n"로 구분된 SSE 이벤트 파싱
          const events = buffer.split("\n\n");
          // 마지막 요소는 불완전할 수 있으므로 버퍼에 보존
          buffer = events.pop() ?? "";

          for (const rawEvent of events) {
            if (!rawEvent.trim()) continue;

            // "data: " 접두사 제거
            const dataLine = rawEvent
              .split("\n")
              .find((line) => line.startsWith("data: "));
            if (!dataLine) continue;

            const jsonStr = dataLine.slice("data: ".length);
            let parsed: {
              provider: ProviderName;
              type: "delta" | "done" | "error";
              content?: string;
              data?: Record<string, unknown>;
              message?: string;
            };

            try {
              parsed = JSON.parse(jsonStr) as typeof parsed;
            } catch {
              continue;
            }

            const { provider, type } = parsed;

            if (type === "delta") {
              // 델타 이벤트: rawText에 누적 및 streaming 상태 유지
              updateProviderStatus(provider, "streaming");
              updateOutput(provider, (prev) => ({
                ...prev,
                streaming: true,
                rawText: prev.rawText + (parsed.content ?? ""),
              }));
            } else if (type === "done") {
              // 완료 이벤트: 최종 데이터로 업데이트
              const finalData = parsed.data ?? {};
              // Record<string, unknown>을 Record<string, string>으로 변환
              const stringData: Record<string, string> = Object.fromEntries(
                Object.entries(finalData).map(([k, v]) => [
                  k,
                  typeof v === "string" ? v : JSON.stringify(v),
                ])
              );
              updateProviderStatus(provider, "done");
              updateOutput(provider, (prev) => ({
                ...prev,
                data: stringData,
                generated: true,
                streaming: false,
              }));
            } else if (type === "error") {
              // 에러 이벤트
              updateProviderStatus(provider, "error");
              updateOutput(provider, (prev) => ({
                ...prev,
                streaming: false,
                error: parsed.message ?? "알 수 없는 오류",
              }));
            }
          }
        }
      } catch (err) {
        // AbortError는 취소이므로 무시
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        // 기타 오류: 모든 loading/streaming 프로바이더를 에러 상태로 전환
        const errorMessage = err instanceof Error ? err.message : "네트워크 오류";
        enabledProviders.forEach((provider) => {
          setProviderStatus((prev) => {
            if (prev[provider] === "loading" || prev[provider] === "streaming") {
              return { ...prev, [provider]: "error" };
            }
            return prev;
          });
          updateOutput(provider, (prev) => {
            if (!prev.generated) {
              return { ...prev, streaming: false, error: errorMessage };
            }
            return prev;
          });
        });
        throw err;
      } finally {
        setIsGenerating(false);
      }
    },
    [updateProviderStatus, updateOutput]
  );

  /**
   * 스트리밍 취소
   * provider 인수가 없으면 전체 취소
   */
  const cancelStreaming = useCallback(
    (provider?: ProviderName) => {
      if (provider) {
        // 특정 프로바이더만 취소 (현재 구현에서는 전체 스트림 취소)
        // 개별 취소는 서버 측 구현 필요 - 현재는 전체 중단
        abortControllerRef.current?.abort();
        updateProviderStatus(provider, "idle");
      } else {
        // 전체 취소
        abortControllerRef.current?.abort();
        setIsGenerating(false);
        setProviderStatus(INITIAL_STATUS);
        setOutputs((prev) => {
          const updated = { ...prev };
          (Object.keys(updated) as ProviderName[]).forEach((p) => {
            if (updated[p].streaming) {
              updated[p] = { ...updated[p], streaming: false };
            }
          });
          return updated;
        });
      }
    },
    [updateProviderStatus]
  );

  /**
   * 출력 상태 초기화
   */
  const resetOutputs = useCallback(() => {
    setOutputs(INITIAL_OUTPUTS);
    setProviderStatus(INITIAL_STATUS);
    setIsGenerating(false);
  }, []);

  return {
    outputs,
    providerStatus,
    isGenerating,
    startStreaming,
    cancelStreaming,
    resetOutputs,
  };
}
