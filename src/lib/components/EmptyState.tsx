import type { ReactNode } from "react";
import { IconInbox } from "../icons";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/** 빈 데이터 상태. 무엇이 없는지 + 다음 행동을 안내합니다. */
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span className="text-text-muted">{icon ?? <IconInbox width={32} height={32} />}</span>
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
