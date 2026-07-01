import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface CardProps {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** 콘텐츠 컨테이너. surface 배경 + 경계선. */
export function Card({ title, action, children, className, bodyClassName }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-lg border border-line bg-surface shadow-1",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          {title && <h2 className="text-sm font-semibold text-text">{title}</h2>}
          {action}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
