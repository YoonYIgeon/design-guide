import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { IconChevronDown } from "../icons";

export interface SelectOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** 선택지 목록. 값은 props, 선택은 onChange 로 내보냅니다. */
  options: SelectOption[];
  /** 미선택 상태로 노출할 안내 항목(선택). value="" 인 disabled 옵션으로 그려집니다. */
  placeholder?: string;
}

/**
 * 네이티브 <select> 기반 셀렉트. 레이블·힌트·에러를 접근성 속성과 함께 연결합니다.
 * 프레젠테이션 전용 — 값은 value, 선택은 onChange 로만 주고받습니다.
 * (docs/08-presentational-only.md)
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, hint, error, options, placeholder, id, className, required, value, ...rest },
    ref,
  ) => {
    const autoId = useId();
    const selectId = id ?? autoId;
    const describedBy = error
      ? `${selectId}-error`
      : hint
        ? `${selectId}-hint`
        : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text">
            {label}
            {required && <span className="ml-0.5 text-danger">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-10 w-full appearance-none rounded-md border bg-surface pl-3 pr-9 text-sm text-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "disabled:cursor-not-allowed disabled:opacity-60",
              // placeholder(빈 값) 선택 시 muted 로 보이도록
              value === "" ? "text-text-muted" : undefined,
              error ? "border-danger" : "border-line",
              className,
            )}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <IconChevronDown
            width={16}
            height={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
        </div>
        {error ? (
          <p id={`${selectId}-error`} className="text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${selectId}-hint`} className="text-xs text-text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Select.displayName = "Select";
