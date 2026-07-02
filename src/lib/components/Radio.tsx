import { useId, type ReactNode } from "react";
import { cn } from "../utils/cn";

export interface RadioOption {
  label: ReactNode;
  value: string;
  /** 옵션별 보조 설명(선택). */
  hint?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  /** 그룹 전체 레이블. */
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** 같은 그룹으로 묶는 name(라디오는 name 이 같아야 단일 선택됩니다). */
  name: string;
  /** 선택된 값(제어값). */
  value: string;
  options: RadioOption[];
  required?: boolean;
  disabled?: boolean;
  /** 배치 방향(기본 세로). */
  orientation?: "vertical" | "horizontal";
  /** 선택 변경. 값 반영은 컨테이너 책임. */
  onChange: (value: string) => void;
}

/**
 * 라디오 그룹. 라디오는 본질적으로 "그룹 안에서 하나 선택"이므로 개별 라디오가 아니라
 * 그룹 단위로 제공합니다. fieldset/legend 로 그룹을 접근성 있게 묶습니다.
 * 프레젠테이션 전용 — 값은 value, 선택은 onChange 로만 주고받습니다.
 */
export function RadioGroup({
  label,
  hint,
  error,
  name,
  value,
  options,
  required,
  disabled,
  orientation = "vertical",
  onChange,
}: RadioGroupProps) {
  const groupId = useId();
  const describedBy = error
    ? `${groupId}-error`
    : hint
      ? `${groupId}-hint`
      : undefined;

  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy}>
      {label && (
        <legend className="mb-1 text-sm font-medium text-text">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </legend>
      )}
      <div
        className={cn(
          "flex gap-2",
          orientation === "horizontal" ? "flex-row flex-wrap gap-x-5" : "flex-col",
        )}
      >
        {options.map((opt) => {
          const optDisabled = disabled || opt.disabled;
          return (
            <label
              key={opt.value}
              className={cn(
                "flex select-none items-start gap-2 text-sm text-text",
                optDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                disabled={optDisabled}
                required={required}
                aria-invalid={error ? true : undefined}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 border-line accent-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
              />
              <span className="flex flex-col">
                <span>{opt.label}</span>
                {opt.hint && (
                  <span className="text-xs text-text-muted">{opt.hint}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error ? (
        <p id={`${groupId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${groupId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
