import { useId, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../utils/cn";

export interface StepSelectorProps {
  /** 필드 레이블(예: "당도"). 문자열/노드 모두 가능. */
  label?: ReactNode;
  /** 레이블 옆 보조 슬롯(예: 도움말 아이콘/툴팁). 값이 있으면 그대로 렌더합니다. */
  help?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** 접근성/폼 연동용 이름. */
  name?: string;
  /** 단계 수(기본 5). 1..steps 사이의 정수를 값으로 사용합니다. */
  steps?: number;
  /**
   * 선택된 단계(1..steps). 제어값이며 범위를 벗어나면(예: 0) 선택 없음으로 봅니다.
   */
  value: number;
  /** 각 단계 아래 숫자를 표시할지(기본 true). */
  showValues?: boolean;
  /** 트랙 왼쪽 끝 캡션(예: "드라이"). */
  minLabel?: ReactNode;
  /** 트랙 오른쪽 끝 캡션(예: "스위트"). */
  maxLabel?: ReactNode;
  /** 단계 변경. 값 반영은 컨테이너 책임. */
  onChange: (value: number) => void;
}

/** i번째 단계의 트랙상 위치(%) — 첫 점 0%, 마지막 점 100%. */
function positionOf(index: number, steps: number): number {
  if (steps <= 1) return 0;
  return (index / (steps - 1)) * 100;
}

/**
 * 다섯 단계(기본) 스텝 셀렉터. 라벨·좌우 캡션·도움말 슬롯을 열어두고,
 * 트랙 위 점을 클릭하거나 방향키로 단계를 고릅니다.
 * 프레젠테이션 전용 — 값은 value, 선택은 onChange 로만 주고받습니다.
 */
export function StepSelector({
  label,
  help,
  hint,
  error,
  required,
  disabled,
  name,
  steps = 5,
  value,
  showValues = true,
  minLabel,
  maxLabel,
  onChange,
}: StepSelectorProps) {
  const fieldId = useId();
  const count = Math.max(1, Math.floor(steps));
  const selectedIndex = value >= 1 && value <= count ? value - 1 : -1;
  const fillPct = selectedIndex >= 0 ? positionOf(selectedIndex, count) : 0;

  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  function commit(next: number) {
    if (disabled) return;
    const clamped = Math.min(count, Math.max(1, next));
    if (clamped !== value) onChange(clamped);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const current = selectedIndex >= 0 ? value : 1;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        commit(selectedIndex >= 0 ? value + 1 : 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        commit(current - 1);
        break;
      case "Home":
        e.preventDefault();
        commit(1);
        break;
      case "End":
        e.preventDefault();
        commit(count);
        break;
    }
  }

  const points = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="flex flex-col gap-1.5" aria-describedby={describedBy}>
      <div
        className={cn("flex flex-col gap-1.5", disabled && "opacity-60")}
      >
        {(label || help) && (
          <div className="flex items-center gap-1.5 text-sm font-medium text-text">
            {label && (
              <span>
                {label}
                {required && <span className="ml-0.5 text-danger">*</span>}
              </span>
            )}
            {help && (
              <span className="inline-flex items-center text-text-muted">{help}</span>
            )}
          </div>
        )}

        <div>
          {/* 트랙 + 점 + 큰 노브 */}
          <div
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label={typeof label === "string" ? label : undefined}
            aria-valuemin={1}
            aria-valuemax={count}
            aria-valuenow={selectedIndex >= 0 ? value : undefined}
            aria-disabled={disabled || undefined}
            aria-invalid={error ? true : undefined}
            onKeyDown={handleKeyDown}
            className={cn(
              "relative h-5",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
              "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            )}
          >
            {/* 레일(미선택) */}
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
            {/* 채움(선택 구간) */}
            {selectedIndex > 0 && (
              <div
                className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
                style={{ left: 0, width: `${fillPct}%` }}
              />
            )}
            {/* 단계 점 */}
            {points.map((i) => {
              const pct = positionOf(i, count);
              const isSelected = i === selectedIndex;
              const isFilled = selectedIndex >= 0 && i <= selectedIndex;
              return (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  aria-hidden
                  disabled={disabled}
                  onClick={() => commit(i + 1)}
                  className={cn(
                    "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[height,width]",
                    disabled ? "cursor-not-allowed" : "cursor-pointer",
                    isSelected
                      ? "h-5 w-5 border-2 border-surface bg-primary shadow-1"
                      : isFilled
                        ? "h-2 w-2 border-2 border-surface bg-primary"
                        : "h-2 w-2 bg-line",
                  )}
                  style={{ left: `${pct}%` }}
                />
              );
            })}
          </div>

          {/* 숫자 라벨 */}
          {showValues && (
            <div className="relative mt-2 h-4">
              {points.map((i) => (
                <span
                  key={i}
                  className="absolute -translate-x-1/2 text-sm text-text-muted"
                  style={{ left: `${positionOf(i, count)}%` }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          )}

          {/* 좌우 캡션 */}
          {(minLabel || maxLabel) && (
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span>{minLabel}</span>
              <span>{maxLabel}</span>
            </div>
          )}

          {/* 폼 연동용 히든 인풋 */}
          {name && (
            <input
              type="hidden"
              name={name}
              value={selectedIndex >= 0 ? value : ""}
            />
          )}
        </div>
      </div>

      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
