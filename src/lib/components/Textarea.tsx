import { forwardRef, useId, type TextareaHTMLAttributes, type ReactNode } from "react";
import { cn } from "../utils/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

/**
 * 여러 줄 입력 필드. 레이블·힌트·에러를 접근성 속성과 함께 연결합니다.
 * Input 과 동일 계약 — 값=value, 변경=onChange, 스타일은 토큰(bg-surface/border-line)만 사용.
 * (docs/08-presentational-only.md)
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, id, className, required, readOnly, rows = 4, ...rest }, ref) => {
    const autoId = useId();
    const textareaId = id ?? autoId;
    const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-text">
            {label}
            {required && <small className="ml-0.5 font-semibold text-primary">(필수)</small>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full py-2 text-sm text-text",
            "placeholder:text-text-muted focus-visible:outline-none",
            // 읽기 전용: 테두리/배경 없이 밑줄만. 그 외: 카드형 테두리+포커스 링.
            readOnly
              ? "cursor-default rounded-none border-0 border-b bg-transparent px-0"
              : "rounded-md border bg-surface px-3 focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:bg-surface-muted",
            error ? "border-danger" : "border-line",
            className,
          )}
          {...rest}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${textareaId}-hint`} className="text-xs text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
