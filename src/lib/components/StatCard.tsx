import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: { value: string; direction: "up" | "down" };
  icon?: ReactNode;
}

/** 대시보드 요약 지표 카드. */
export function StatCard({ label, value, delta, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4 shadow-1">
      <div className="flex items-start justify-between">
        <p className="text-sm text-text-muted">{label}</p>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold text-text">{value}</span>
        {delta && (
          <span
            className={cn(
              "pb-1 text-xs font-medium",
              delta.direction === "up" ? "text-success" : "text-danger",
            )}
          >
            {delta.direction === "up" ? "▲" : "▼"} {delta.value}
          </span>
        )}
      </div>
    </div>
  );
}
