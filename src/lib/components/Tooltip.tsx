import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../utils/cn";

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** 말풍선에 그려질 내용. 문자열/노드 모두 가능. */
  content: ReactNode;
  /** 트리거. 단일 요소면 aria-describedby 를 주입해 접근성을 연결합니다. */
  children: ReactNode;
  /** 말풍선 위치(기본 top). */
  placement?: TooltipPlacement;
  /** 호버 후 표시까지의 지연(ms, 기본 150). 포커스는 지연 없이 표시합니다. */
  delayMs?: number;
  /**
   * 제어형 열림 상태. 지정하면 호버/포커스 대신 이 값을 따릅니다.
   * 생략하면 순수 UI 상태(호버/포커스)로 내부에서 관리합니다.
   */
  open?: boolean;
  disabled?: boolean;
  /** 말풍선에 덧붙일 클래스. */
  className?: string;
}

const bubbleClass: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2",
  left: "right-full top-1/2 mr-2 -translate-y-1/2",
  right: "left-full top-1/2 ml-2 -translate-y-1/2",
};

const arrowClass: Record<TooltipPlacement, string> = {
  top: "-bottom-1 left-1/2 -translate-x-1/2",
  bottom: "-top-1 left-1/2 -translate-x-1/2",
  left: "-right-1 top-1/2 -translate-y-1/2",
  right: "-left-1 top-1/2 -translate-y-1/2",
};

/**
 * 프레젠테이션 전용 툴팁. 트리거를 감싸고 호버/포커스에 말풍선을 보여줍니다.
 * - 열림 상태는 순수 UI 상태로 내부 관리하며, 필요하면 open 으로 제어할 수 있습니다.
 * - 말풍선은 항상 DOM 에 두고 시각적으로만 토글해 aria-describedby 연결을 유지합니다.
 * - Escape 로 닫히고, 트리거가 단일 요소면 aria-describedby 를 자동 주입합니다.
 */
export function Tooltip({
  content,
  children,
  placement = "top",
  delayMs = 150,
  open,
  disabled,
  className,
}: TooltipProps) {
  const tooltipId = useId();
  const [hoverOpen, setHoverOpen] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(showTimer.current), []);

  const visible = !disabled && !!content && (open ?? hoverOpen);

  function show(immediate: boolean) {
    if (disabled) return;
    clearTimeout(showTimer.current);
    if (immediate || delayMs <= 0) setHoverOpen(true);
    else showTimer.current = setTimeout(() => setHoverOpen(true), delayMs);
  }

  function hide() {
    clearTimeout(showTimer.current);
    setHoverOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key === "Escape") hide();
  }

  // 단일 요소 트리거면 aria-describedby 를 주입하고, 아니면 래퍼에 연결합니다.
  let describable = false;
  let trigger = children;
  if (isValidElement(children)) {
    describable = true;
    const el = children as ReactElement<{ "aria-describedby"?: string }>;
    trigger = cloneElement(el, {
      "aria-describedby": cn(el.props["aria-describedby"], tooltipId),
    });
  }

  return (
    <span
      className="relative inline-flex"
      aria-describedby={describable ? undefined : tooltipId}
      onMouseEnter={() => show(false)}
      onMouseLeave={hide}
      onFocusCapture={() => show(true)}
      onBlurCapture={hide}
      onKeyDown={handleKeyDown}
    >
      {trigger}
      <span
        id={tooltipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-50 w-max max-w-60 rounded px-2 py-1 text-xs shadow-2 transition-opacity",
          "bg-text text-surface",
          bubbleClass[placement],
          visible ? "opacity-100" : "invisible opacity-0",
          className,
        )}
      >
        {content}
        <span
          aria-hidden
          className={cn("absolute h-2 w-2 rotate-45 bg-text", arrowClass[placement])}
        />
      </span>
    </span>
  );
}
