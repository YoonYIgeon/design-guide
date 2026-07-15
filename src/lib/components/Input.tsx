import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leading?: ReactNode;
  /** 입력 오른쪽 끝 장식(스피너·상태 아이콘 등). */
  trailing?: ReactNode;
}

/** 레이블·힌트·에러를 접근성 속성과 함께 연결한 입력 필드. */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leading, trailing, id, className, required, readOnly, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

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
