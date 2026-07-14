import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";
import { IconCheck, IconChevronDown, IconClose } from "../icons";

export interface SelectOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

interface SelectBaseProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** 선택지 목록. 값은 props, 선택은 onChange 로 내보냅니다. */
  options: SelectOption[];
  /** 미선택 상태로 노출할 안내 문구(선택). 값이 없으면 muted 로 노출됩니다. */
  placeholder?: string;
  /** 네이티브 폼 제출용 hidden input 의 name(선택). 다중 선택은 같은 name 으로 값마다 하나씩 렌더합니다. */
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  /** 읽기 전용: 값은 보이되 열기/선택은 막고, 테두리 없이 밑줄만 표시. */
  readOnly?: boolean;
  /** 선택값 지우기(X) 아이콘 노출 여부(기본 true). 선택된 값이 있을 때만 보입니다. */
  clearable?: boolean;
  className?: string;
}

export interface SelectSingleProps extends SelectBaseProps {
  /** 다중 선택 여부(기본 false = 단일 선택). */
  multiple?: false;
  /** 선택된 값(제어값). 미선택은 빈 문자열 `""`. */
  value: string;
  /** 선택 변경. 값(string)만 넘깁니다(RadioGroup 과 동일 계약). 값 반영은 컨테이너 책임. */
  onChange: (value: string) => void;
}

export interface SelectMultipleProps extends SelectBaseProps {
  /** 다중 선택 모드. 옵션을 토글해도 목록이 닫히지 않습니다. */
  multiple: true;
  /** 선택된 값 배열(제어값). 미선택은 빈 배열 `[]`. */
  value: string[];
  /** 선택 변경. 토글이 반영된 값 배열(string[])을 넘깁니다. 값 반영은 컨테이너 책임. */
  onChange: (values: string[]) => void;
}

export type SelectProps = SelectSingleProps | SelectMultipleProps;

/** 드롭다운 목록의 최대 높이(px). Tailwind `max-h-60`(15rem) 과 일치시켜 flip 판단에 씁니다. */
const MENU_MAX_HEIGHT = 240;
/** 트리거와 목록 사이 간격(px). Dropdown 과 동일. */
const GAP = 4;

/** 활성 인덱스에서 방향(step) 으로 다음 선택 가능한 옵션을 찾습니다. */
function nextEnabled(options: SelectOption[], from: number, step: 1 | -1): number {
  const len = options.length;
  for (let i = 1; i <= len; i += 1) {
    const idx = (from + step * i + len * i) % len;
    if (!options[idx]?.disabled) return idx;
  }
  return from;
}

function firstEnabled(options: SelectOption[]): number {
  const idx = options.findIndex((o) => !o.disabled);
  return idx === -1 ? 0 : idx;
}

function lastEnabled(options: SelectOption[]): number {
  for (let i = options.length - 1; i >= 0; i -= 1) {
    if (!options[i]?.disabled) return i;
  }
  return options.length - 1;
}

/**
 * 커스텀 드롭다운(ARIA select-only combobox). 네이티브 <select> 를 쓰지 않고
 * 라이브러리 디자인 토큰으로 트리거·목록을 직접 그려 브라우저 간 외형을 통일합니다.
 * 키보드(↑/↓/Home/End/Enter/Space/Esc/타이핑 검색)·포커스·바깥 클릭 닫기를 처리합니다.
 * 목록은 Dropdown/Tooltip 과 같이 portal(document.body) + fixed 좌표로 그려
 * 조상 overflow/stacking context 에 잘리지 않습니다. 열릴 때 트리거 위치를 재서
 * 위/아래 뒤집기와 너비를 정하고, 바깥 스크롤·리사이즈 시에는(목록 내부 스크롤 제외)
 * 위치를 다시 재는 대신 닫습니다(네이티브 select 와 동일).
 * 프레젠테이션 전용 — 값은 value, 선택은 onChange 로만 주고받습니다.
 * `multiple` 이면 value/onChange 가 string[] 계약이 되고, 옵션 토글 시 목록이 닫히지 않습니다.
 * `clearable`(기본 true) 이면 선택값이 있을 때 X 아이콘으로 지울 수 있습니다
 * (키보드는 Backspace/Delete).
 * (docs/08-presentational-only.md)
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>((props, ref) => {
  const {
    label,
    hint,
    error,
    options,
    placeholder,
    name,
    id,
    required,
    disabled,
    readOnly,
    clearable = true,
    className,
    multiple,
    onChange,
  } = props;
  // 단일/다중을 내부에서는 값 배열 하나로 통일해 다룹니다(단일 미선택 "" 은 빈 배열).
  const values = multiple ? props.value : props.value ? [props.value] : [];

  const autoId = useId();
  const baseId = id ?? autoId;
  const listboxId = `${baseId}-listbox`;
  const labelId = label ? `${baseId}-label` : undefined;
  const describedBy = error
    ? `${baseId}-error`
    : hint
      ? `${baseId}-hint`
      : undefined;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  // portal 로 그릴 목록의 fixed 좌표(위/아래 뒤집기 포함). 열릴 때 재계산.
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  // 타이핑 검색용 버퍼.
  const typeahead = useRef({ query: "", at: 0 });

  const isSelected = (v: string) => values.includes(v);
  // 트리거 표시·열 때의 초기 활성 위치는 options 순서 기준 첫 선택 항목.
  const selectedIndex = options.findIndex((o) => isSelected(o.value));
  const selectedOptions = options.filter((o) => isSelected(o.value));

  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled || readOnly) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(options));
    setOpen(true);
  }, [disabled, readOnly, options, selectedIndex]);

  // 목록을 연 뒤 트리거 위/아래 여유 공간을 재서 잘리지 않을 쪽으로 위치를 정한다
  // (아래 우선). portal 로 그리므로 트리거 좌표를 fixed 스타일로 직접 넘겨야 한다.
  useLayoutEffect(() => {
    if (!open) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeTop = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
    const next: CSSProperties = { left: rect.left, width: rect.width };
    if (placeTop) next.bottom = window.innerHeight - rect.top + GAP;
    else next.top = rect.bottom + GAP;
    setStyle(next);
  }, [open]);

  const commit = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt || opt.disabled) return;
      if (multiple) {
        // 토글 결과 배열을 넘기고, 연속 선택을 위해 목록은 열어 둡니다.
        const next = values.includes(opt.value)
          ? values.filter((v) => v !== opt.value)
          : [...values, opt.value];
        (onChange as (v: string[]) => void)(next);
        return;
      }
      (onChange as (v: string) => void)(opt.value);
      close();
      buttonRef.current?.focus();
    },
    [options, multiple, values, onChange, close],
  );

  const clearValue = useCallback(() => {
    if (multiple) (onChange as (v: string[]) => void)([]);
    else (onChange as (v: string) => void)("");
  }, [multiple, onChange]);

  // 바깥 클릭 시 닫기(트리거·목록 모두 바깥일 때만 — 목록은 portal 로 그려져
  // rootRef 밖에 있으므로 listRef 도 함께 확인한다).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // 바깥 영역 스크롤/리사이즈 시 닫기(트리거에 붙은 플로팅 목록이 다른 콘텐츠 위에
  // 겹쳐 떠 보이거나 위치가 어긋나는 것을 방지 — 네이티브 select 와 동일).
  // 목록 내부 스크롤은 유지.
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      close();
    };
    // scroll 이벤트는 버블링되지 않으므로 캡처 단계로 모든 조상 스크롤을 잡습니다.
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close]);

  // 활성 옵션을 목록 스크롤 안으로 이동.
  useEffect(() => {
    if (open && activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || readOnly) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => nextEnabled(options, i < 0 ? -1 : i, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => nextEnabled(options, i < 0 ? 0 : i, -1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(firstEnabled(options));
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(lastEnabled(options));
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) openMenu();
        else if (activeIndex >= 0) commit(activeIndex);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        break;
      case "Tab":
        if (open) close();
        break;
      case "Backspace":
      case "Delete":
        // 목록을 열지 않고도 지울 수 있게(마우스 X 아이콘과 동일한 키보드 대안).
        if (clearable && selectedOptions.length > 0) {
          e.preventDefault();
          clearValue();
        }
        break;
      default: {
        // 타이핑 검색(첫 글자로 옵션 이동). 문자열 라벨만 대상으로 합니다.
        if (e.key.length !== 1 || e.altKey || e.ctrlKey || e.metaKey) break;
        const now = Date.now();
        const buf = typeahead.current;
        buf.query = now - buf.at > 600 ? e.key : buf.query + e.key;
        buf.at = now;
        const q = buf.query.toLowerCase();
        const startFrom = open ? (activeIndex < 0 ? 0 : activeIndex) : selectedIndex;
        const len = options.length;
        for (let i = 1; i <= len; i += 1) {
          const idx = (startFrom + i + len) % len;
          const opt = options[idx];
          if (opt.disabled || typeof opt.label !== "string") continue;
          if (opt.label.toLowerCase().startsWith(q)) {
            if (open) setActiveIndex(idx);
            else if (multiple) {
              // 닫힌 상태의 다중 선택은 값을 바꾸지 않고 해당 옵션을 활성으로 엽니다.
              setOpen(true);
              setActiveIndex(idx);
            } else (onChange as (v: string) => void)(opt.value);
            break;
          }
        }
        break;
      }
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label id={labelId} htmlFor={baseId} className="text-sm font-medium text-text">
          {label}
          {required && <small className="ml-0.5 font-semibold text-primary">(필수)</small>}
        </label>
      )}
      <div ref={rootRef} className="relative">
        <button
          ref={(node) => {
            buttonRef.current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          id={baseId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          aria-labelledby={labelId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          aria-readonly={readOnly || undefined}
          disabled={disabled}
          onClick={() => {
            if (readOnly) return;
            open ? close() : openMenu();
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-10 w-full items-center justify-between text-left text-sm text-text",
            "focus-visible:outline-none",
            // 읽기 전용: 테두리/배경 없이 밑줄만. 그 외: 카드형 테두리+포커스 링.
            readOnly
              ? "cursor-default rounded-none border-0 border-b bg-transparent pl-0 pr-0"
              : cn(
                  "rounded-md border bg-surface pl-3 pr-3",
                  "focus-visible:ring-2 focus-visible:ring-primary/40",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                ),
            // 미선택(placeholder) 은 muted 로.
            selectedOptions.length > 0 ? undefined : "text-text-muted",
            error ? "border-danger" : "border-line",
            className,
          )}
        >
          <span className="truncate">
            {selectedOptions.length > 0
              ? selectedOptions.map((opt, i) => (
                  <Fragment key={opt.value}>
                    {i > 0 && ", "}
                    {opt.label}
                  </Fragment>
                ))
              : placeholder}
          </span>
          {!readOnly && (
            <span className="ml-2 flex shrink-0 items-center gap-1">
              {clearable && !disabled && selectedOptions.length > 0 && (
                // 버튼 안에 <button> 을 중첩할 수 없어 마우스 전용 아이콘으로 두고,
                // 키보드 대안은 Backspace/Delete(handleKeyDown)로 제공합니다.
                <span
                  aria-hidden="true"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearValue();
                  }}
                  className="rounded p-0.5 text-text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <IconClose width={14} height={14} />
                </span>
              )}
              <IconChevronDown
                width={16}
                height={16}
                className={cn("text-text-muted transition-transform", open && "rotate-180")}
              />
            </span>
          )}
        </button>

        {open &&
          createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={labelId}
              aria-multiselectable={multiple || undefined}
              style={style ?? { left: -9999, top: -9999 }}
              className={cn(
                "fixed z-[70] max-h-60 overflow-auto rounded-md border border-line bg-surface py-1 shadow-2",
                "focus-visible:outline-none",
              )}
            >
              {options.map((opt, index) => {
                const selected = isSelected(opt.value);
                const active = index === activeIndex;
                return (
                  <li
                    key={opt.value}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    id={optionId(index)}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={opt.disabled || undefined}
                    onMouseEnter={() => !opt.disabled && setActiveIndex(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => commit(index)}
                    className={cn(
                      "flex items-center justify-between gap-2 px-3 py-2 text-sm",
                      opt.disabled
                        ? "cursor-not-allowed text-text-muted opacity-60"
                        : "cursor-pointer text-text",
                      active && !opt.disabled && "bg-surface-muted",
                      selected && "font-medium text-primary",
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {selected && (
                      <IconCheck width={16} height={16} className="shrink-0 text-primary" />
                    )}
                  </li>
                );
              })}
            </ul>,
            document.body,
          )}

        {/* 네이티브 폼 제출용(선택). 값 동기화만 담당합니다. 다중은 같은 name 으로 값마다 하나씩. */}
        {name &&
          (multiple ? (
            values.map((v) => <input key={v} type="hidden" name={name} value={v} />)
          ) : (
            <input type="hidden" name={name} value={values[0] ?? ""} />
          ))}
      </div>
      {error ? (
        <p id={`${baseId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${baseId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
Select.displayName = "Select";
