import { useEffect, useRef, type ReactNode } from "react";
import { IconClose } from "../icons";
import { cn } from "../utils/cn";
import { Button } from "./Button";

/** 패널 최대 폭. 기본 "md"(기존 동작과 동일). 테이블 등 넓은 내용은 lg~2xl 사용. */
export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";

export interface ModalProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** 패널 최대 폭 (기본 "md"). */
  size?: ModalSize;
  /** ESC / 오버레이 클릭 / 닫기 버튼으로 닫힘 (기본 true). */
  dismissible?: boolean;
  onClose: () => void;
}

const sizeClass: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg", // 기존 기본값(하위 호환)
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

/** 확인·상세용 모달. ESC 닫기, 포커스 이동, 복귀 포커스를 처리합니다. */
export function Modal({
  open,
  title,
  children,
  footer,
  size = "md",
  dismissible = true,
  onClose,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previousFocus.current?.focus();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full rounded-lg border border-line bg-surface shadow-3 focus-visible:outline-none",
          sizeClass[size],
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-base font-semibold text-text">{title}</h2>
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="닫기"
              className="-my-1 -mr-1 h-9 w-9 shrink-0 p-0 text-text-muted hover:text-text"
            >
              <IconClose width={20} height={20} />
            </Button>
          )}
        </header>
        <div className="px-4 py-4">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-line px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
