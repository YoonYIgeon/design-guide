import type { ReactNode } from "react";
import { cn } from "../utils/cn";

/** 헤더 색조(의미 기반). 기본은 색 없는 기존 헤더입니다. */
export type CardHeaderTone =
  | "default"
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info";

const headerToneClass: Record<CardHeaderTone, string> = {
  default: "text-text",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** 헤더 색조(토큰 기반). 색·간격 하드코딩 대신 이 값으로 지정합니다. */
  headerTone?: CardHeaderTone;
  /** 헤더 커스텀 클래스(자유 조합용 이스케이프 해치). */
  headerClassName?: string;
}

/** 콘텐츠 컨테이너. surface 배경 + 경계선. */
export function Card({
  title,
  action,
  children,
  className,
  bodyClassName,
  headerTone = "default",
  headerClassName,
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-line bg-surface shadow-1",
        className,
      )}
    >
      {(title || action) && (
        <header
          className={cn(
            "flex items-center justify-between gap-3 rounded-t-lg border-b border-line px-4 py-3",
            headerToneClass[headerTone],
            headerClassName,
          )}
        >
          {title && <h2 className="text-sm font-semibold text-current">{title}</h2>}
          {action}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
