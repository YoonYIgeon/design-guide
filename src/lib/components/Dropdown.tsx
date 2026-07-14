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

interface DropdownBaseProps {
  /** 트리거. 단일 요소여야 하며 열림 상태를 알리는 aria 속성을 주입합니다. */
  children: ReactElement;
  /** 트리거 기준 패널의 가로 정렬(기본 end = 트리거 오른쪽 끝에 맞춤). */
  align?: "start" | "end";
  disabled?: boolean;
  className?: string;
}

export interface DropdownMenuProps extends DropdownBaseProps {
  /** 메뉴 항목(단순 액션 목록일 때). */
  items: DropdownItem[];
  /** 항목 선택. 값(value)만 넘깁니다. 실행은 컨테이너 책임. */
  onSelect: (value: string) => void;
  content?: never;
}

export interface DropdownPanelProps extends DropdownBaseProps {
  /**
   * 필터 폼처럼 임의 구성이 필요할 때 그릴 내용. 함수로 주면 `close()` 를 받아
   * "적용"/"초기화" 버튼 클릭 시 컨테이너가 직접 패널을 닫을 수 있습니다.
   * 항목 목록(items)과 달리 내부 클릭으로 자동으로 닫히지 않습니다.
   */
  content: ReactNode | ((helpers: { close: () => void }) => ReactNode);
  items?: never;
  onSelect?: never;
}

export type DropdownProps = DropdownMenuProps | DropdownPanelProps;

/** 트리거와 패널 사이 간격(px). */
const GAP = 4;

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
 * 프레젠테이션 전용 드롭다운. 트리거를 감싸고 클릭 시 카드형 패널을 띄웁니다.
 * 두 가지 모드:
 * - 메뉴 모드(`items`+`onSelect`): role="menu" 목록. 항목 클릭 시 자동으로 닫힙니다.
 * - 커스텀 모드(`content`): 필터 폼처럼 임의 콘텐츠. 내부 클릭으로 닫히지 않고
 *   바깥 클릭/Esc, 또는 `content` 함수가 받는 `close()` 호출로만 닫힙니다.
 *
 * 공통 동작:
 * - 패널을 실제로 렌더링한 뒤 높이를 측정해 위/아래 뒤집기를 판단합니다
 *   (아래 공간이 부족하면 위로 뒤집어 열림 — Select 와 같은 원리).
 * - Tooltip 과 같이 portal(document.body) + fixed 좌표로 그려 조상 overflow/stacking
 *   context 에 잘리지 않고, 열려 있는 동안 스크롤/리사이즈에 따라 위치를 갱신합니다.
 * - 값은 items/onSelect 또는 content 로만 오가며 실행(라우팅·삭제·필터 적용 등)은
 *   컨테이너 책임입니다.
 * (docs/08-presentational-only.md, docs/11-flexible-composition.md)
 */
export function Dropdown(props: DropdownProps) {
  const { children, align = "end", disabled, className } = props;
  const isMenu = "items" in props && props.items != null;

  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const anchorRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openPanel = useCallback(() => {
    if (disabled) return;
    setActiveIndex(-1);
    setOpen(true);
  }, [disabled]);

  // 패널을 실제로 그린 뒤 크기를 측정해 위치를 정합니다(위/아래 뒤집기 포함).
  // 열려 있는 동안은 스크롤/리사이즈에 따라 갱신합니다.
  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const anchorRect = anchorRef.current?.getBoundingClientRect();
      if (!anchorRect) return;
      const panelHeight = panelRef.current?.getBoundingClientRect().height ?? 0;
      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const spaceAbove = anchorRect.top;
      const placeTop = spaceBelow < panelHeight && spaceAbove > spaceBelow;
      const next: CSSProperties = {};
      if (placeTop) next.bottom = window.innerHeight - anchorRect.top + GAP;
      else next.top = anchorRect.bottom + GAP;
      if (align === "start") next.left = anchorRect.left;
      else next.right = window.innerWidth - anchorRect.right;
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

  // 바깥 클릭 시 닫기(트리거·패널 모두 바깥일 때만).
  // 커스텀 콘텐츠는 패널 내부 클릭으로 닫히지 않도록 여기서만 처리합니다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // 활성 항목을 패널 스크롤 안으로 이동(메뉴 모드).
  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const items = isMenu ? (props as DropdownMenuProps).items : [];
  const onSelect = isMenu ? (props as DropdownMenuProps).onSelect : undefined;

  const commit = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      onSelect?.(item.value);
      close();
    },
    [items, onSelect, close],
  );

  function handleKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (disabled) return;
    if (e.key === "Escape" && open) {
      e.preventDefault();
      close();
      return;
    }
    // 커스텀 콘텐츠(필터 폼 등)는 내부 입력 요소가 방향키/Tab/Enter 를 직접 써야
    // 하므로, 항목 탐색 키보드 처리는 메뉴 모드에서만 합니다.
    if (!isMenu) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) openPanel();
        else setActiveIndex((i) => nextEnabled(items, i < 0 ? -1 : i, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) openPanel();
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
      case "Tab":
        if (open) close();
        break;
      default:
        break;
    }
  }

  // 트리거가 단일 요소면 스크린리더용 aria 속성과 열기/닫기 클릭 핸들러를 주입합니다
  // (Tooltip 과 동일한 cloneElement 패턴). 열기/닫기는 반드시 트리거 요소 자체에만
  // 걸어야 합니다 — 패널은 portal 로 그려지지만 React 트리 기준으로는 이 트리거의
  // 하위이므로, 감싸는 요소의 onClick 에 걸면 패널 내부(체크박스 등) 클릭도 그리로
  // 버블링되어 의도치 않게 닫혀버립니다.
  let trigger: ReactNode = children;
  if (isValidElement(children)) {
    const el = children as ReactElement<{
      "aria-haspopup"?: string;
      "aria-expanded"?: boolean;
      "aria-controls"?: string;
      onClick?: (e: React.MouseEvent) => void;
    }>;
    trigger = cloneElement(el, {
      "aria-haspopup": isMenu ? "menu" : "dialog",
      "aria-expanded": open,
      "aria-controls": open ? panelId : undefined,
      onClick: (e: React.MouseEvent) => {
        el.props.onClick?.(e);
        if (disabled) return;
        open ? close() : openPanel();
      },
    });
  }

  let panelBody: ReactNode;
  if (isMenu) {
    panelBody = items.map((item, index) => {
      const active = index === activeIndex;
      return (
        <div
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
        </div>
      );
    });
  } else {
    const { content } = props as DropdownPanelProps;
    panelBody = typeof content === "function" ? content({ close }) : content;
  }

  return (
    <span ref={anchorRef} className="relative inline-block" onKeyDown={handleKeyDown}>
      {trigger}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role={isMenu ? "menu" : undefined}
            aria-orientation={isMenu ? "vertical" : undefined}
            style={style ?? { left: -9999, top: -9999 }}
            className={cn(
              "fixed z-[70] overflow-auto rounded-md border border-line bg-surface shadow-2",
              "focus-visible:outline-none",
              isMenu ? "min-w-40 max-h-60 py-1" : "max-h-[70vh] min-w-48 p-3",
              className,
            )}
          >
            {panelBody}
          </div>,
          document.body,
        )}
    </span>
  );
}
Dropdown.displayName = "Dropdown";
