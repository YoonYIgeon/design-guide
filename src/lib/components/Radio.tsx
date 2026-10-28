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
  /** 읽기 전용: 라디오는 그대로 보이되 선택 색을 회색으로 하고 조작만 막습니다. */
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

  return (
    <fieldset
      // aria-readonly 는 radiogroup 역할에서만 유효해 역할을 명시합니다.
      role="radiogroup"
      className="flex flex-col gap-1.5"
      aria-describedby={describedBy}
      aria-readonly={readOnly || undefined}
    >
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
                optDisabled
                  ? "cursor-not-allowed opacity-60"
                  : readOnly
                    ? "cursor-default"
                    : "cursor-pointer",
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
                // 라디오는 네이티브 readOnly 가 없어 클릭 기본 동작(선택)을 막아 조작만 차단합니다.
                onClick={readOnly ? (e) => e.preventDefault() : undefined}
                onChange={(e) => {
                  if (!readOnly) onChange(e.target.value);
                }}
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0 border-line",
                  // 읽기 전용은 값은 보이되 조작 불가임을 회색 선택으로 구분합니다.
                  readOnly ? "accent-text-muted" : "accent-primary",
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
