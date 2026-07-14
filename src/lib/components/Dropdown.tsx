import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

export interface DropdownItem {
  label: ReactNode;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  /** 삭제처럼 되돌릴 수 없는 동작임을 강조합니다(빨간 텍스트). */
  danger?: boolean;
}

export interface DropdownProps {
  /** 트리거. 단일 요소여야 하며 열림 상태를 알리는 aria 속성을 주입합니다. */
  children: ReactElement;
  /** 메뉴 항목. */
  items: DropdownItem[];
  /** 항목 선택. 값(value)만 넘깁니다. 실행은 컨테이너 책임. */
  onSelect: (value: string) => void;
  /** 트리거 기준 메뉴의 가로 정렬(기본 end = 트리거 오른쪽 끝에 맞춤). */
  align?: "start" | "end";
  disabled?: boolean;
  className?: string;
}

/** 트리거와 메뉴 사이 간격(px). */
const GAP = 4;
/** 드롭다운 메뉴의 최대 높이(px). Tailwind `max-h-60`(15rem) 과 일치시켜 flip 판단에 씁니다. */
const MENU_MAX_HEIGHT = 240;

function nextEnabled(items: DropdownItem[], from: number, step: 1 | -1): number {
  const len = items.length;
  for (let i = 1; i <= len; i += 1) {
    const idx = (from + step * i + len * i) % len;
    if (!items[idx]?.disabled) return idx;
  }
  return from;
}

function firstEnabled(items: DropdownItem[]): number {
  const idx = items.findIndex((o) => !o.disabled);
  return idx === -1 ? 0 : idx;
}

function lastEnabled(items: DropdownItem[]): number {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (!items[i]?.disabled) return i;
  }
  return items.length - 1;
}

/**
 * 프레젠테이션 전용 액션 드롭다운. 트리거를 감싸고 클릭 시 카드형 메뉴를 띄웁니다.
 * - Select 와 같은 flip 로직으로 아래 공간이 부족하면 메뉴를 위로 뒤집어 엽니다.
 * - Tooltip 과 같이 portal(document.body) + fixed 좌표로 그려 조상 overflow/stacking
 *   context 에 잘리지 않고, 열려 있는 동안 스크롤/리사이즈에 따라 위치를 갱신합니다.
 * - 값은 items/onSelect 로만 오가며 실행(라우팅·삭제 등)은 컨테이너 책임입니다.
 * (docs/08-presentational-only.md)
 */
export function Dropdown({
  children,
  items,
  onSelect,
  align = "end",
  disabled,
  className,
}: DropdownProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const anchorRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    setActiveIndex(-1);
    setOpen(true);
  }, [disabled]);

  // 열릴 때 트리거 기준 위치를 재고(위/아래 뒤집기 포함),
  // 열려 있는 동안 스크롤/리사이즈에 따라 갱신합니다.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placeTop = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;
      const next: CSSProperties = {};
      if (placeTop) next.bottom = window.innerHeight - rect.top + GAP;
      else next.top = rect.bottom + GAP;
      if (align === "start") next.left = rect.left;
      else next.right = window.innerWidth - rect.right;
      setStyle(next);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align]);

  // 바깥 클릭 시 닫기(트리거·메뉴 모두 바깥일 때만).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // 활성 항목을 메뉴 스크롤 안으로 이동.
  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const commit = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      onSelect(item.value);
      close();
    },
    [items, onSelect, close],
  );

  function handleKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => nextEnabled(items, i < 0 ? -1 : i, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openMenu();
        else setActiveIndex((i) => nextEnabled(items, i < 0 ? 0 : i, -1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(firstEnabled(items));
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(lastEnabled(items));
        }
        break;
      case "Enter":
      case " ":
        if (open) {
          e.preventDefault();
          if (activeIndex >= 0) commit(activeIndex);
        }
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
      default:
        break;
    }
  }

  // 트리거가 단일 요소면 스크린리더용 aria 속성을 주입합니다(Tooltip 과 동일 패턴).
  let trigger: ReactNode = children;
  if (isValidElement(children)) {
    const el = children as ReactElement<{
      "aria-haspopup"?: string;
      "aria-expanded"?: boolean;
      "aria-controls"?: string;
    }>;
    trigger = cloneElement(el, {
      "aria-haspopup": "menu",
      "aria-expanded": open,
      "aria-controls": open ? menuId : undefined,
    });
  }

  return (
    <span
      ref={anchorRef}
      className="relative inline-block"
      onClick={() => {
        if (disabled) return;
        open ? close() : openMenu();
      }}
      onKeyDown={handleKeyDown}
    >
      {trigger}
      {open &&
        createPortal(
          <ul
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-orientation="vertical"
            style={style ?? { left: -9999, top: -9999 }}
            className={cn(
              "fixed z-[70] min-w-40 max-h-60 overflow-auto rounded-md border border-line bg-surface py-1 shadow-2",
              "focus-visible:outline-none",
              className,
            )}
          >
            {items.map((item, index) => {
              const active = index === activeIndex;
              return (
                <li
                  key={item.value}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  role="menuitem"
                  aria-disabled={item.disabled || undefined}
                  onMouseEnter={() => !item.disabled && setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(index)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm",
                    item.disabled
                      ? "cursor-not-allowed text-text-muted opacity-60"
                      : cn("cursor-pointer", item.danger ? "text-danger" : "text-text"),
                    active && !item.disabled && "bg-surface-muted",
                  )}
                >
                  {item.icon && (
                    <span className="shrink-0" aria-hidden>
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </span>
  );
}
Dropdown.displayName = "Dropdown";
