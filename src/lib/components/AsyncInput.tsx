import { useEffect, useRef, useState, type ReactNode } from "react";
import { Input, type InputProps } from "./Input";
import { IconAlertCircle, IconCheckCircle } from "../icons";

export type AsyncInputStatus = "idle" | "loading" | "success" | "error";

export interface AsyncInputProps<Res = unknown>
  extends Omit<InputProps, "value" | "onChange" | "error" | "trailing"> {
  /** 제어값. */
  value: string;
  /** 값 변경(즉시 반영). 저장은 컨테이너 책임. */
  onChange: (value: string) => void;
  /**
   * 디바운스 후 호출되는 비동기 리졸버. **실제 HTTP/조회는 이 콜백 안(컨테이너)에서**
   * 수행하고 응답을 반환합니다. 컴포넌트는 네트워크를 모릅니다(docs/08-presentational-only.md).
   * 전달된 `signal` 로 취소(이전 요청 abort)에 대응하세요.
   */
  resolve: (value: string, signal: AbortSignal) => Promise<Res>;
  /** 디바운스 지연(ms, 기본 400). */
  debounceMs?: number;
  /**
   * 응답을 에러 메시지로 해석하는 커스텀 훅. 값(ReactNode)을 반환하면 에러,
   * `null`/`undefined` 를 반환하면 성공으로 봅니다.
   * (예: 200 응답이지만 `{ available: false }` 처럼 "실패 의미"일 때 에러로 변환)
   */
  getError?: (response: Res) => ReactNode | null | undefined;
  /** 성공 시 표시할 메시지(선택). `null`/`undefined` 면 표시하지 않습니다. */
  getSuccess?: (response: Res) => ReactNode | null | undefined;
  /** `resolve` 가 throw 했을 때(네트워크/예외) 메시지로 변환. 기본 문구를 제공합니다. */
  getRequestError?: (error: unknown) => ReactNode;
  /** 검사 성공(에러 없음) 시 응답 객체를 통지(선택) — 컨테이너가 결과를 저장할 때. */
  onResolved?: (response: Res) => void;
  /** 상태 변화 통지(선택). */
  onStatusChange?: (status: AsyncInputStatus) => void;
  /** 빈 값이면 검사를 건너뜁니다(기본 true). */
  skipEmpty?: boolean;
  /** 이 길이 미만이면 검사를 건너뜁니다(기본 0). */
  minLength?: number;
}

/**
 * 디바운스된 비동기 검사 입력. 입력이 멈추면 `resolve` 를 호출하고,
 * 로딩 스피너·성공/에러 표시를 오케스트레이션합니다.
 *
 * 프레젠테이션 전용 경계(docs/08): 컴포넌트는 **디바운스와 상태 표시(순수 UI)만** 담당하고,
 * 실제 HTTP/조회(`resolve`)와 "응답 → 에러/성공" 해석(`getError`/`getSuccess`/`getRequestError`)은
 * **전부 주입된 콜백**입니다. 컴포넌트 내부에는 fetch/axios·도메인 규칙이 없습니다.
 */
export function AsyncInput<Res = unknown>({
  value,
  onChange,
  resolve,
  debounceMs = 400,
  getError,
  getSuccess,
  getRequestError = () => "확인 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.",
  onResolved,
  onStatusChange,
  skipEmpty = true,
  minLength = 0,
  hint,
  ...inputProps
}: AsyncInputProps<Res>) {
  const [status, setStatus] = useState<AsyncInputStatus>("idle");
  const [message, setMessage] = useState<ReactNode>(null);

  // 부모가 매 렌더 새 인라인 콜백을 넘겨도 디바운스 effect 가 재실행되지 않도록
  // 최신 콜백을 ref 로 고정한다(effect deps 는 값 관련 원시값만 둔다).
  const cbs = useRef({ resolve, getError, getSuccess, getRequestError, onResolved });
  cbs.current = { resolve, getError, getSuccess, getRequestError, onResolved };

  const statusRef = useRef(status);
  statusRef.current = status;

  useEffect(() => {
    const shouldSkip =
      (skipEmpty && value.trim() === "") || value.length < minLength;
    if (shouldSkip) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    // 값이 바뀌면 이전 유효성 표시는 무효 → 즉시 로딩 상태로.
    setStatus("loading");
    setMessage(null);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await cbs.current.resolve(value, controller.signal);
        if (controller.signal.aborted) return;
        const err = cbs.current.getError?.(res);
        if (err != null && err !== false) {
          setStatus("error");
          setMessage(err);
        } else {
          setStatus("success");
          setMessage(cbs.current.getSuccess?.(res) ?? null);
          cbs.current.onResolved?.(res);
        }
      } catch (e) {
        if (controller.signal.aborted || (e as { name?: string })?.name === "AbortError") {
          return;
        }
        setStatus("error");
        setMessage(cbs.current.getRequestError(e));
      }
    }, debounceMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [value, debounceMs, skipEmpty, minLength]);

  useEffect(() => {
    onStatusChange?.(status);
    // onStatusChange 는 통지 전용 — deps 에서 제외해 통지 자체가 재실행을 유발하지 않게 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const trailing =
    status === "loading" ? (
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden
      />
    ) : status === "success" ? (
      <IconCheckCircle className="h-4 w-4 text-success" aria-hidden />
    ) : status === "error" ? (
      <IconAlertCircle className="h-4 w-4 text-danger" aria-hidden />
    ) : undefined;

  return (
    <Input
      {...inputProps}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      trailing={trailing}
      error={status === "error" ? message : undefined}
      hint={status === "success" && message ? message : hint}
      aria-busy={status === "loading" || undefined}
    />
  );
}
