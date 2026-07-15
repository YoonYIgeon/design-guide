import { useId, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Input } from "./Input";

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
  /** 읽기 전용: 선택된 옵션 라벨만 밑줄 Input 으로 표시. */
  readOnly?: boolean;
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
  readOnly,
  orientation = "vertical",
  onChange,
}: RadioGroupProps) {
  const groupId = useId();
  const describedBy = error
    ? `${groupId}-error`
    : hint
      ? `${groupId}-hint`
      : undefined;

  // 읽기 전용: 선택된 옵션 라벨(문자열)만 밑줄 Input 으로 표시.
  if (readOnly) {
    const selected = options.find((o) => o.value === value);
    const display =
      selected && typeof selected.label === "string" ? selected.label : (selected?.value ?? "");
    return (
      <Input
        label={label}
        hint={hint}
        error={error}
        value={display}
        required={required}
        readOnly
      />
    );
  }

  return (
    <fieldset className="flex flex-col gap-1.5" aria-describedby={describedBy}>
      {label && (
        <legend className="mb-1 text-sm font-medium text-text">
          {label}
          {required && <small className="ml-0.5 font-semibold text-primary">(필수)</small>}
        </legend>
      )}
      <div
        className={cn(
          // 다른 입력 컨트롤(h-10)과 높이를 맞추기 위해 최소 높이를 확보하고 세로 가운데 정렬.
          "flex min-h-[2.5rem] gap-2",
          orientation === "horizontal"
            ? "flex-row flex-wrap items-center gap-x-5"
            : "flex-col justify-center",
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
