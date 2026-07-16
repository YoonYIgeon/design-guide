import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** 셀 렌더러. 생략 시 row[key] 를 그대로 표시. */
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
}

/**
 * 페이지네이션(controlled) 설정.
 *
 * 프레젠테이션 전용 원칙에 따라 DataTable 은 행을 직접 자르지 않습니다.
 * `rows` 에는 항상 "현재 페이지의 행"만 전달하세요(클라이언트 페이징이면 소비 측에서 slice,
 * 서버 페이징이면 해당 페이지만 fetch). 이 컴포넌트는 컨트롤을 그리고 이동 의도만 콜백으로 냅니다.
 */
export interface DataTablePagination {
  /** 현재 페이지(1-based). */
  page: number;
  /** 페이지당 행 수. */
  pageSize: number;
  /** 전체 행 수(페이지 수 계산용). */
  total: number;
  /** 페이지 이동 요청. 실제 데이터 조회/슬라이싱은 소비 시스템이 처리합니다. */
  onPageChange: (page: number) => void;
  /** 페이지 크기 선택지(선택). 주면 크기 셀렉트를 노출합니다. */
  pageSizeOptions?: number[];
  /** 페이지 크기 변경 요청(선택). */
  onPageSizeChange?: (pageSize: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  /**
   * 행별 추가 className(선택). 행 상태에 따라 스타일을 덧입히는 이스케이프 해치입니다.
   * 예: 선택된 행 배경 강조 — `rowClassName={(u) => u.id === selectedId ? "bg-primary/5" : undefined}`.
   *
   * 기본 클래스(테두리·hover 등) 뒤에 이어 붙으므로 색·배경을 덮어쓸 수 있습니다.
   * 토큰 기반 유틸(`bg-primary/5` 등)만 사용하고 색을 하드코딩하지 마세요.
   */
  rowClassName?: (row: T) => string | false | null | undefined;
  /** 페이지네이션(controlled). 주면 테이블 하단에 페이지 컨트롤을 렌더합니다. */
  pagination?: DataTablePagination;
  /**
   * 상위 컨테이너의 높이를 꽉 채우고, 헤더·푸터(페이지네이션)를 고정한 채
   * 본문(tbody)만 세로 스크롤합니다. 기본 false(내용 높이만큼만 차지).
   *
   * true 로 쓰려면 부모가 높이를 제한해야 합니다(예: 부모에 `h-full`/고정 높이,
   * 또는 flex 컨테이너의 자식이라 높이가 정해지는 경우).
   */
  fillHeight?: boolean;
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

/** 테이블 하단 페이지 컨트롤. 이동/크기 변경은 콜백으로만 냅니다(프레젠테이션 전용). */
function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
}: DataTablePagination) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <p className="text-text-muted">
        총 {total.toLocaleString()}건
        {total > 0 && (
          <>
            {" · "}
            {start.toLocaleString()}–{end.toLocaleString()}
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        {pageSizeOptions && onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-text-muted">
            페이지당
            <select
              aria-label="페이지당 행 수"
              className="h-8 rounded-md border border-line bg-surface px-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <Button
          variant="secondary"
          size="sm"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          이전
        </Button>
        <span className="min-w-[4rem] text-center tabular-nums text-text-muted">
          {current} / {pageCount}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={current >= pageCount}
          onClick={() => onPageChange(current + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}

/** 관리자 목록 테이블. loading/empty/error 상태를 항상 명시적으로 표현합니다. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyText = "표시할 데이터가 없습니다.",
  onRowClick,
  rowClassName,
  pagination,
  fillHeight = false,
}: DataTableProps<T>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface",
        fillHeight && "flex h-full flex-col",
      )}
    >
      <div
        className={cn(
          "overflow-x-auto",
          fillHeight && "flex min-h-0 flex-1 flex-col overflow-y-auto",
        )}
      >
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(
                    "whitespace-nowrap px-4 py-2.5 font-medium text-text-muted",
                    alignClass[col.align ?? "left"],
                    // border-collapse 에서는 sticky 헤더의 아래 테두리가 스크롤 시
                    // 사라지므로 inset box-shadow 로 구분선을 보강한다.
                    fillHeight &&
                      "sticky top-0 z-10 bg-surface-muted shadow-[inset_0_-1px_0_var(--au-color-border)]",
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-line last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-full max-w-[160px] animate-pulse rounded bg-surface-muted" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              !error &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-line last:border-0",
                    onRowClick && "cursor-pointer hover:bg-surface-muted",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3 text-text",
                        alignClass[col.align ?? "left"],
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>

        {!loading && error && (
          <div
            className={cn(
              "px-4 py-10 text-center text-sm text-danger",
              fillHeight && "flex flex-1 items-center justify-center",
            )}
          >
            {error}
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className={cn(fillHeight && "flex flex-1 items-center justify-center")}>
            <EmptyState title={emptyText} />
          </div>
        )}
      </div>

      {pagination && <PaginationBar {...pagination} />}
    </div>
  );
}
