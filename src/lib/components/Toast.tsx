import type { ReactNode } from "react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheckCircle,
  IconClose,
  IconInfoCircle,
} from "../icons";
import { cn } from "../utils/cn";
import { Button } from "./Button";

export type ToastTone = "info" | "success" | "warning" | "danger";

export interface ToastProps {
  /** 시각적 톤(색/아이콘). 값 판단은 소비 시스템이 함. */
  tone?: ToastTone;
  title?: ReactNode;
  /** 본문 메시지. */
  children: ReactNode;
  /** 닫기 버튼 노출 여부(기본 true). */
  dismissible?: boolean;
  /** 닫기 의도만 전달. 실제 제거는 호출한 쪽(프로바이더)이 함. */
  onDismiss?: () => void;
  className?: string;
}

const toneClass: Record<ToastTone, string> = {
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const toneIcon: Record<ToastTone, typeof IconInfoCircle> = {
  info: IconInfoCircle,
  success: IconCheckCircle,
  warning: IconAlertTriangle,
  danger: IconAlertCircle,
};

/**
 * 프레젠테이션 전용 토스트 카드.
 * - 값은 props, 닫기 의도는 onDismiss 콜백으로만 전달합니다.
 * - 자동 사라짐(타이머)·큐 관리는 소비 시스템(프로바이더)의 몫입니다.
 *   (docs/08-presentational-only.md)
 */
export function Toast({
  tone = "info",
  title,
  children,
  dismissible = true,
  onDismiss,
  className,
}: ToastProps) {
  const Icon = toneIcon[tone];
  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-3",
        className,
      )}
    >
      <span className={cn("mt-0.5 shrink-0", toneClass[tone])}>
        <Icon width={18} height={18} />
      </span>
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-semibold text-text">{title}</p>}
        <p className={cn("text-sm text-text-muted", title ? "mt-0.5" : undefined)}>
          {children}
        </p>
      </div>
      {dismissible && onDismiss && (
        // 닫기 버튼은 sm 사이즈(h-8=32px) 때문에 본문 한 줄(20px)보다 커서,
        // 그대로 flex 행에 두면 items-start 정렬상 남는 높이가 아래로 쏠려
        // 카드 상하 여백이 어긋납니다. 첫 줄 높이(h-5)로 고정한 트랙에 담아
        // 세로 중앙 정렬로 넘치게 두면 행 높이를 키우지 않아 상하 여백이 맞습니다.
        // (!p-0: size="sm" 의 px-3 가로 패딩을 눌러 아이콘이 찌그러지지 않게 함)
        <span className="-mr-1 flex h-5 shrink-0 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="닫기"
            className="h-8 w-8 !p-0"
          >
            <IconClose width={16} height={16} />
          </Button>
        </span>
      )}
    </div>
  );
}

export type ToastPosition =
  | "top-right"
  | "top-center"
  | "bottom-right"
  | "bottom-center";

export interface ToastViewportProps {
  children: ReactNode;
  /** 스택 위치(기본 top-right). */
  position?: ToastPosition;
  className?: string;
}

const positionClass: Record<ToastPosition, string> = {
  "top-right": "top-0 right-0 items-end",
  "top-center": "top-0 left-1/2 -translate-x-1/2 items-center",
  "bottom-right": "bottom-0 right-0 items-end",
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2 items-center",
};

/**
 * 프레젠테이션 전용 토스트 뷰포트.
 * 여러 토스트를 고정 위치에 쌓아 그립니다. 내용/순서는 주입받습니다.
 */
export function ToastViewport({
  children,
  position = "top-right",
  className,
}: ToastViewportProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed z-[60] flex w-full max-w-sm flex-col gap-2 p-4",
        positionClass[position],
        className,
      )}
    >
      {children}
    </div>
  );
}
