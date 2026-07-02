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

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** 체크박스 오른쪽에 붙는 라벨. */
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** 부분 선택 상태(예: 전체 선택 헤더). checked 와 별개로 시각 표시만 담당. */
  indeterminate?: boolean;
}

/**
 * 단일 체크박스. 여러 개를 묶을 때는 이 컴포넌트를 목록으로 나열하고
 * 상태 배열을 컨테이너가 관리합니다(그룹 상태는 하네스 책임).
 * 프레젠테이션 전용 — 값은 checked, 변경은 onChange 로만 주고받습니다.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, hint, error, indeterminate = false, id, className, disabled, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined;

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
