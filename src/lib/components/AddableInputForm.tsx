import { useId, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { Button } from "./Button";
import { IconPlus, IconTrash } from "../icons";

export interface AddableInputFormProps<Item = unknown> {
  /** 필드 레이블(예: "담당자 이메일"). 문자열/노드 모두 가능. */
  label?: ReactNode;
  /** 레이블 옆 보조 슬롯(도움말 아이콘/툴팁 등). */
  help?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** 읽기 전용(값 표시만). `disabled` 와 마찬가지로 추가/삭제 버튼을 숨깁니다. */
  readOnly?: boolean;
  /**
   * 렌더할 행 배열. 이 컴포넌트는 상태를 갖지 않으며, 이 배열이 곧 화면의 행 수입니다.
   * (예: react-hook-form `useFieldArray` 의 `fields`)
   */
  items: readonly Item[];
  /**
   * 각 행의 안정적인 key. 기본은 배열 index 지만, 재정렬/삭제가 있으면
   * 고유 key(예: react-hook-form field 의 `id`)를 주는 것을 권장합니다.
   */
  getKey?: (item: Item, index: number) => string | number;
  /** 각 행의 내용을 그리는 렌더 함수. (item, index) 를 받아 입력 노드를 반환합니다. */
  children: (item: Item, index: number) => ReactNode;
  /** 행 추가 의도. 실제 추가는 컨테이너 책임(예: `append(...)`). */
  onAdd: () => void;
  /** 행 삭제 의도. 실제 삭제는 컨테이너 책임(예: `remove(index)`). */
  onRemove: (index: number) => void;
  /** 추가 버튼 라벨(기본 "추가"). */
  addLabel?: ReactNode;
  /** 이 값 이하이면 삭제 버튼을 비활성화합니다(표시 전용 가드). */
  min?: number;
  /** 이 값 이상이면 추가 버튼을 비활성화합니다(표시 전용 가드). */
  max?: number;
  /** 행이 없을 때 표시할 안내. 값이 없으면 빈 상태를 그리지 않습니다. */
  emptyText?: ReactNode;
  /** 각 행 삭제 버튼의 aria-label(기본 "N번째 항목 삭제"). */
  removeAriaLabel?: (index: number) => string;
  /**
   * 행들을 감싸는 컨테이너에 얹을 추가 클래스. 기본은 세로 스택(`flex flex-col gap-2`)이며,
   * `flex-row` 등을 주어 가로 배치로 확장할 수 있습니다.
   * (`flex-row` 를 주면 기본 `flex-col` 은 자동으로 제외됩니다.)
   */
  className?: string;
}

/**
 * 추가/삭제 가능한 입력 행들을 그리는 프레젠테이션 전용 컨테이너.
 *
 * - 상태를 갖지 않습니다. 행 목록은 `items`, 각 행의 내용은 `children(item, index)`,
 *   추가/삭제는 `onAdd`/`onRemove` 콜백으로만 주고받습니다.
 * - 폼 로직(값 관리·검증·필드 배열)은 소비 시스템의 몫입니다.
 *   react-hook-form 을 쓴다면 `useForm` + `useFieldArray` 를 컨테이너에 두고,
 *   `fields`/`append`/`remove` 를 이 컴포넌트에 연결하세요. (docs/08-presentational-only.md)
 */
export function AddableInputForm<Item = unknown>({
  label,
  help,
  hint,
  error,
  required,
  disabled,
  readOnly,
  items,
  getKey,
  children,
  onAdd,
  onRemove,
  addLabel = "추가",
  min,
  max,
  emptyText,
  removeAriaLabel,
  className,
}: AddableInputFormProps<Item>) {
  const fieldId = useId();
  const describedBy = error
    ? `${fieldId}-error`
    : hint
      ? `${fieldId}-hint`
      : undefined;

  const hideActions = disabled || readOnly;
  const canRemove = (index: number) =>
    !disabled && (min === undefined || items.length > min) && index >= 0;
  const canAdd =
    !disabled && (max === undefined || items.length < max);

  return (
    <div className="flex flex-col gap-1.5" aria-describedby={describedBy}>
      {(label || help) && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-text">
          {label && (
            <span>
              {label}
              {required && (
                <small className="ml-0.5 font-semibold text-primary">(필수)</small>
              )}
            </span>
          )}
          {help && (
            <span className="inline-flex items-center text-text-muted">{help}</span>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex gap-2",
          // 기본은 세로 스택. className 이 (반응형 아닌) flex-row 로 방향을 바꾸면
          // 소스 순서상 기본 flex-col 이 이기지 못하므로 flex-col 을 뺀다.
          /(^|\s)flex-(row|row-reverse)(\s|$)/.test(className ?? "")
            ? undefined
            : "flex-col",
          (disabled || readOnly) && "opacity-60",
          className,
        )}
      >
        {items.length === 0 && emptyText ? (
          <p className="rounded-md border border-dashed border-line px-3 py-4 text-center text-sm text-text-muted">
            {emptyText}
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={getKey ? getKey(item, index) : index}
              className="flex items-start gap-2"
            >
              <div className="min-w-0 flex-1">{children(item, index)}</div>
              {!hideActions && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="shrink-0 px-2 text-text-muted hover:text-danger"
                  disabled={!canRemove(index)}
                  aria-label={
                    removeAriaLabel ? removeAriaLabel(index) : `${index + 1}번째 항목 삭제`
                  }
                  onClick={() => onRemove(index)}
                >
                  <IconTrash className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </div>
          ))
        )}

        {!hideActions && (
          <div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!canAdd}
              onClick={onAdd}
            >
              <IconPlus className="h-4 w-4" aria-hidden />
              {addLabel}
            </Button>
          </div>
        )}
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
