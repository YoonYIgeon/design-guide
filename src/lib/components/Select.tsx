import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";
import { IconCheck, IconChevronDown } from "../icons";

export interface SelectOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** 선택지 목록. 값은 props, 선택은 onChange 로 내보냅니다. */
  options: SelectOption[];
  /** 미선택 상태로 노출할 안내 문구(선택). 값이 없으면 muted 로 노출됩니다. */
  placeholder?: string;
  /** 선택된 값(제어값). 미선택은 빈 문자열 `""`. */
  value: string;
  /** 선택 변경. 값(string)만 넘깁니다(RadioGroup 과 동일 계약). 값 반영은 컨테이너 책임. */
  onChange: (value: string) => void;
  /** 네이티브 폼 제출용 hidden input 의 name(선택). */
  name?: string;
  id?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

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
 * 프레젠테이션 전용 — 값은 value, 선택은 onChange(값 string) 로만 주고받습니다.
 * (docs/08-presentational-only.md)
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    { label, hint, error, options, placeholder, value, onChange, name, id, required, disabled, className },
    ref,
  ) => {
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

    const rootRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
    // 타이핑 검색용 버퍼.
    const typeahead = useRef({ query: "", at: 0 });

    const selectedIndex = options.findIndex((o) => o.value === value);
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

    const optionId = (index: number) => `${baseId}-opt-${index}`;

    const close = useCallback(() => {
      setOpen(false);
      setActiveIndex(-1);
    }, []);

    const openMenu = useCallback(() => {
      if (disabled) return;
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled(options));
      setOpen(true);
    }, [disabled, options, selectedIndex]);

    const commit = useCallback(
      (index: number) => {
        const opt = options[index];
        if (!opt || opt.disabled) return;
        onChange(opt.value);
        close();
        buttonRef.current?.focus();
      },
      [options, onChange, close],
    );

    // 바깥 클릭 시 닫기.
    useEffect(() => {
      if (!open) return;
      const onPointerDown = (e: MouseEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) close();
      };
      document.addEventListener("mousedown", onPointerDown);
      return () => document.removeEventListener("mousedown", onPointerDown);
    }, [open, close]);

    // 활성 옵션을 목록 스크롤 안으로 이동.
    useEffect(() => {
      if (open && activeIndex >= 0) {
        optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [open, activeIndex]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
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
              else onChange(opt.value);
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
            {required && <span className="ml-0.5 text-danger">*</span>}
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
            disabled={disabled}
            onClick={() => (open ? close() : openMenu())}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border bg-surface pl-3 pr-3 text-left text-sm text-text",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              "disabled:cursor-not-allowed disabled:opacity-60",
              // 미선택(placeholder) 은 muted 로.
              selectedOption ? undefined : "text-text-muted",
              error ? "border-danger" : "border-line",
              className,
            )}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <IconChevronDown
              width={16}
              height={16}
              className={cn(
                "ml-2 shrink-0 text-text-muted transition-transform",
                open && "rotate-180",
              )}
            />
          </button>

          {open && (
            <ul
              id={listboxId}
              role="listbox"
              aria-labelledby={labelId}
              className={cn(
                "absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line bg-surface py-1 shadow-2",
                "focus-visible:outline-none",
              )}
            >
              {options.map((opt, index) => {
                const selected = opt.value === value;
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
                    {selected && <IconCheck width={16} height={16} className="shrink-0 text-primary" />}
                  </li>
                );
              })}
            </ul>
          )}

          {/* 네이티브 폼 제출용(선택). 값 동기화만 담당합니다. */}
          {name && <input type="hidden" name={name} value={value} />}
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
  },
);
Select.displayName = "Select";
