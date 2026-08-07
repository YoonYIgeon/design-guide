import {
  forwardRef,
  useId,
  type ChangeEvent,
  type CompositionEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { applyAllowedChars } from "../utils/allow";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leading?: ReactNode;
  /** 입력 오른쪽 끝 장식(스피너·상태 아이콘 등). */
  trailing?: ReactNode;
  /** 제어값. API/DB 에서 온 `null` 도 그대로 받아 빈 문자열로 표시합니다. */
  value?: InputHTMLAttributes<HTMLInputElement>["value"] | null;
  /**
   * 입력 가능한 **문자 집합**을 정규식으로 제한합니다(예: `/[a-z0-9]/` → 영소문자·숫자만).
   * 한 글자씩 `test` 하므로 값 전체를 매칭하는 `/^[a-z0-9]+$/` 가 아니라 **문자 클래스**로 씁니다.
   *
   * 타이핑·붙여넣기·드래그&드롭 모두에서 허용되지 않는 문자는 조용히 제거되며,
   * `onChange` 에는 **이미 걸러진 값**이 담긴 이벤트가 전달됩니다.
   * IME 조합(한글 등) 중에는 거르지 않고 조합이 끝난 뒤 한 번에 거릅니다.
   */
  allow?: RegExp;
}

/** 레이블·힌트·에러를 접근성 속성과 함께 연결한 입력 필드. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      leading,
      trailing,
      id,
      className,
      required,
      readOnly,
      value,
      allow,
      onChange,
      onCompositionEnd,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      // 조합 중(한글 등)에는 중간 글자를 건드리지 않는다 — 조합이 깨진다.
      // 조합으로 확정된 값은 아래 handleCompositionEnd 에서 거른다.
      if (allow && !(event.nativeEvent as InputEvent).isComposing) {
        applyAllowedChars(event.currentTarget, allow);
      }
      onChange?.(event);
    }

    function handleCompositionEnd(event: CompositionEvent<HTMLInputElement>) {
      onCompositionEnd?.(event);
      if (!allow) return;
      // 브라우저에 따라 조합 확정 input 이벤트가 isComposing=true 로 먼저 오므로,
      // 조합 종료 시점에 한 번 더 거른다. 값이 실제로 바뀌었을 때만 변경을 통지한다.
      if (!applyAllowedChars(event.currentTarget, allow)) return;
      // 값 변경 통지 경로는 onChange 하나뿐이다. 핸들러가 읽는 target/currentTarget 은
      // 같은 <input> 이므로 그대로 넘긴다(합성 이벤트 종류만 다름).
      onChange?.(event as unknown as ChangeEvent<HTMLInputElement>);
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-text">
            {label}
            {required && <small className="ml-0.5 font-semibold text-primary">(필수)</small>}
          </label>
        )}
        <div className="relative">
          {leading && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leading}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            readOnly={readOnly}
            value={value === null ? "" : value}
            onChange={handleChange}
            onCompositionEnd={handleCompositionEnd}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-10 w-full text-sm text-text",
              "placeholder:text-text-muted focus-visible:outline-none",
              // 읽기 전용: 테두리/배경 없이 밑줄만. 그 외: 카드형 테두리+포커스 링.
              readOnly
                ? "cursor-default rounded-none border-0 border-b bg-transparent px-0"
                : "rounded-md border bg-surface px-3 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted",
              leading ? "pl-9" : undefined,
              trailing ? "pr-9" : undefined,
              error ? "border-danger" : "border-line",
              className,
            )}
            {...rest}
          />
          {trailing && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {trailing}
            </span>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-xs text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
