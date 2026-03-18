"use client";
// localStorage 영속성 커스텀 훅
import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // SSR 안전: 초기값은 항상 initialValue
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 마운트 시 localStorage에서 복원
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // 파싱 실패 시 초기값 유지
    }
  }, [key]);

  // 값 설정 + localStorage 저장
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const newValue = value instanceof Function ? value(prev) : value;
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(key, JSON.stringify(newValue));
          } catch {
            // QuotaExceeded 등 무시
          }
        }
        return newValue;
      });
    },
    [key]
  );

  // 삭제
  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  }, [key, initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return [storedValue, setValue, removeValue];
}
