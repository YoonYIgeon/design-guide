import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ForwardedRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { Input, type InputProps } from "./Input";
import { IconAlertCircle, IconCheckCircle } from "../icons";

export type AsyncInputStatus = "idle" | "loading" | "success" | "error";

/** 검사 중일 때의 기본 제출 차단 메시지. */
const DEFAULT_PENDING_MESSAGE = "확인이 끝날 때까지 기다려 주세요.";
/** 에러 메시지가 문자열이 아닐 때(엘리먼트 등) 쓰는 대체 문구. */
const FALLBACK_INVALID_MESSAGE = "입력값을 다시 확인해 주세요.";

/**
 * `setCustomValidity` 는 문자열만 받는다. 메시지가 ReactNode 라 문자열로 못 쓰면 대체 문구를 쓴다.
 */
function toValidityText(node: ReactNode, fallback: string): string {
  if (typeof node === "string") return node.trim() || fallback;
  if (typeof node === "number") return String(node);
  return fallback;
}

export interface AsyncInputProps<Res = unknown>
  extends Omit<InputProps, "value" | "onChange" | "trailing"> {
  /** 제어값. API/DB 에서 온 `null` 도 그대로 받아 빈 문자열로 다룹니다. */
  value: string | null;
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
  /**
   * 외부(컨테이너) 에러를 직접 지정합니다. 값이 있으면 내부 비동기 상태 에러보다 **우선**해서 표시합니다.
   * 입력값 자체의 클라이언트 검증(예: zod) 결과를 여기로 넘기면 됩니다.
   * 이 값이 있으면(로컬 검증 실패) `resolve`(API 호출)를 건너뜁니다 — 로컬 검증이 성공했을 때만 네트워크 검사가 돕니다.
   */
  error?: ReactNode;
  /**
   * 검사 중(`loading`)·검사 실패(`error`)인 동안 내부 `<input>` 에 **네이티브 제약 검증**
   * (`setCustomValidity`)을 걸어 **폼 제출을 막습니다**(기본 `true`).
   *
   * 이게 없으면 응답이 오기 전(로딩)이나 "이미 사용 중" 에러가 떠 있는 상태에서도
   * 폼이 그대로 제출됩니다 — 에러 표시는 순전히 시각적일 뿐 폼 유효성과 무관하기 때문입니다.
   *
   * `<form noValidate>` 를 쓰거나 컨테이너가 이미 직접 게이팅한다면 `false` 로 끌 수 있습니다.
   * (`noValidate` 폼이라면 `onStatusChange` 로 상태를 끌어올려 직접 제출을 막아야 합니다.)
   */
  blockSubmitWhileInvalid?: boolean;
  /** 검사 중(`loading`)일 때 제출을 막으며 보여줄 네이티브 검증 메시지. */
  pendingMessage?: string;
}

function AsyncInputInner<Res = unknown>(
  {
    value: rawValue,
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
    error: errorProp,
    blockSubmitWhileInvalid = true,
    pendingMessage = DEFAULT_PENDING_MESSAGE,
    hint,
    disabled,
    readOnly,
    ...inputProps
  }: AsyncInputProps<Res>,
  ref: ForwardedRef<HTMLInputElement>,
) {
  const value = rawValue ?? "";
  const [status, setStatus] = useState<AsyncInputStatus>("idle");
  const [message, setMessage] = useState<ReactNode>(null);

  // 부모가 매 렌더 새 인라인 콜백을 넘겨도 디바운스 effect 가 재실행되지 않도록
  // 최신 콜백을 ref 로 고정한다(effect deps 는 값 관련 원시값만 둔다).
  const cbs = useRef({ resolve, getError, getSuccess, getRequestError, onResolved });
  cbs.current = { resolve, getError, getSuccess, getRequestError, onResolved };

  const statusRef = useRef(status);
  statusRef.current = status;

  // 네이티브 제약 검증(setCustomValidity)을 걸려면 실제 <input> 요소가 필요하다.
  // 외부에서 넘어온 ref(react-hook-form 등)도 그대로 살려야 하므로 둘 다 채운다.
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // 사용자가 값을 실제로 바꾸기 전(초기 마운트 값 그대로)에는 검사를 시작하지 않는다 —
  // prefill 된 값에 대해 아직 손대지 않았는데 에러가 뜨는 것을 막는다.
  const isDirtyRef = useRef(false);

  // 로컬(클라이언트) 검증 실패 여부. `error` prop 은 입력값 자체의 클라이언트 검증
  // (예: zod) 결과를 받는 자리이므로, 값이 있으면 로컬 검증이 실패한 것으로 본다.
  // ReactNode 를 그대로 deps 에 두면 매 렌더 새 엘리먼트로 재실행될 수 있어 boolean 으로 고정한다.
  const hasLocalError = errorProp != null && errorProp !== false;

  useEffect(() => {
    if (disabled || readOnly || !isDirtyRef.current) {
      setStatus("idle");
      setMessage(null);
      return;
    }

    // 로컬 검증이 실패한 상태면 API(resolve)를 호출하지 않는다 —
    // 로컬 검증이 성공(에러 없음)했을 때만 네트워크 검사를 시작한다.
    const shouldSkip =
      hasLocalError ||
      (skipEmpty && value.trim() === "") ||
      value.length < minLength;
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
  }, [value, debounceMs, skipEmpty, minLength, disabled, readOnly, hasLocalError]);

  useEffect(() => {
    onStatusChange?.(status);
    // onStatusChange 는 통지 전용 — deps 에서 제외해 통지 자체가 재실행을 유발하지 않게 한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // 외부 에러(예: zod 검증 결과)가 있으면 내부 비동기 상태 에러보다 우선한다.
  const effectiveError = errorProp ?? (status === "error" ? message : undefined);

  // 비동기 검사 상태를 폼 유효성에 연결한다.
  // - loading: 응답을 아직 못 받았으므로 "통과"로 볼 수 없다 → 제출 차단.
  // - error:   에러를 화면에만 그리면 폼은 그대로 제출된다 → 제출 차단.
  // 로컬 에러(errorProp)는 그 값을 만든 컨테이너가 이미 알고 게이팅하는 자리라 여기서 건드리지 않는다.
  const validityMessage = !blockSubmitWhileInvalid
    ? ""
    : status === "loading"
      ? pendingMessage
      : status === "error"
        ? toValidityText(message, FALLBACK_INVALID_MESSAGE)
        : "";

  useEffect(() => {
    // disabled/readOnly 인 입력은 브라우저가 제약 검증에서 제외하므로 별도 분기가 필요 없다.
    inputRef.current?.setCustomValidity(validityMessage);
  }, [validityMessage]);

  // `<form noValidate>` 는 네이티브 제약 검증을 통째로 끄므로 위 setCustomValidity 가 무시된다.
  // 그런 폼에서도 제출을 막기 위해 소속 폼의 submit 을 캡처 단계에서 가로챈다.
  // (제약 검증이 살아 있는 폼이라면 애초에 submit 이벤트가 발생하지 않으므로 이 핸들러는 돌지 않는다.)
  useEffect(() => {
    if (!validityMessage) return;
    const el = inputRef.current;
    const form = el?.form;
    if (!form) return;

    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      // noValidate 폼은 네이티브 말풍선을 의도적으로 끈 것이므로 reportValidity 는 부르지 않는다.
      // 대신 문제가 된 입력으로 초점만 옮긴다(에러 문구는 이미 필드 아래 렌더된다).
      el?.focus();
    };
    form.addEventListener("submit", block, true);
    return () => form.removeEventListener("submit", block, true);
  }, [validityMessage]);

  const trailing =
    status === "loading" ? (
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden
      />
    ) : effectiveError ? (
      <IconAlertCircle className="h-4 w-4 text-danger" aria-hidden />
    ) : status === "success" ? (
      <IconCheckCircle className="h-4 w-4 text-success" aria-hidden />
    ) : undefined;

  return (
    <Input
      {...inputProps}
      ref={setRefs}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={(e) => {
        isDirtyRef.current = true;
        onChange(e.target.value);
      }}
      trailing={trailing}
      error={effectiveError}
      hint={status === "success" && message ? message : hint}
      aria-busy={status === "loading" || undefined}
    />
  );
}

/**
 * 디바운스된 비동기 검사 입력. 입력이 멈추면 `resolve` 를 호출하고,
 * 로딩 스피너·성공/에러 표시를 오케스트레이션합니다.
 *
 * 프레젠테이션 전용 경계(docs/08): 컴포넌트는 **디바운스와 상태 표시(순수 UI)만** 담당하고,
 * 실제 HTTP/조회(`resolve`)와 "응답 → 에러/성공" 해석(`getError`/`getSuccess`/`getRequestError`)은
 * **전부 주입된 콜백**입니다. 컴포넌트 내부에는 fetch/axios·도메인 규칙이 없습니다.
 *
 * `forwardRef` 로 감싸 내부 `<input>` 요소로 ref 를 전달한다(react-hook-form `Controller` 등
 * ref 를 주입하는 컨테이너와 호환). 제네릭 `Res` 는 `forwardRef` 로 소실되므로 캐스팅으로 시그니처를 보존한다.
 */
export const AsyncInput = forwardRef(AsyncInputInner) as <Res = unknown>(
  props: AsyncInputProps<Res> & { ref?: Ref<HTMLInputElement> },
) => ReactElement;
