import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { Input } from "./Input";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked"> {
  /** 체크박스 오른쪽에 붙는 라벨. */
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** 부분 선택 상태(예: 전체 선택 헤더). checked 와 별개로 시각 표시만 담당. */
  indeterminate?: boolean;
  /**
   * 제어값. API 응답처럼 nullable 인 값도 그대로 받아 `null` 은 해제(false)로
   * 정규화합니다(`undefined` 는 비제어 유지 — register/defaultChecked 사용처).
   */
  checked?: boolean | null;
}

/**
 * 단일 체크박스. 여러 개를 묶을 때는 이 컴포넌트를 목록으로 나열하고
 * 상태 배열을 컨테이너가 관리합니다(그룹 상태는 하네스 책임).
 * 프레젠테이션 전용 — 값은 checked, 변경은 onChange 로만 주고받습니다.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { label, hint, error, indeterminate = false, id, className, disabled, readOnly, checked, ...rest },
    ref,
  ) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined;

    // 읽기 전용: 체크 상태를 사람이 읽을 문구로 바꿔 밑줄 Input 으로 표시.
    if (readOnly) {
      const display = indeterminate ? "—" : checked ? "예" : "아니오";
      return (
        <Input label={label} hint={hint} error={error} id={inputId} value={display} readOnly />
      );
    }

    const innerRef = useRef<HTMLInputElement | null>(null);
    // indeterminate 는 DOM 프로퍼티라 속성으로 못 주고 ref 로만 설정합니다.
    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={inputId}
          className={cn(
            "flex select-none items-start gap-2 text-sm text-text",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          )}
        >
          <input
            ref={(node) => {
              innerRef.current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            id={inputId}
            type="checkbox"
            checked={checked === null ? false : checked}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 rounded border-line accent-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              className,
            )}
            {...rest}
          />
          {label && <span>{label}</span>}
        </label>
        {error ? (
          <p id={`${inputId}-error`} className="pl-6 text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="pl-6 text-xs text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Checkbox.displayName = "Checkbox";
