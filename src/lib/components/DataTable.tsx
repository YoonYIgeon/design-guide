import { useId, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { IconArrowDown, IconArrowUp, IconArrowUpDown } from "../icons";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { EmptyState } from "./EmptyState";

export type SortDirection = "asc" | "desc";

/**
 * 정렬 상태(controlled).
 *
 * 프레젠테이션 전용 원칙에 따라 DataTable 은 행을 직접 정렬하지 않습니다.
 * `rows` 에는 항상 "이미 정렬된 행"을 전달하세요(클라이언트 정렬이면 소비 측에서 sort,
 * 서버 정렬이면 정렬 파라미터를 붙여 fetch). 이 컴포넌트는 인디케이터를 그리고
 * 정렬 의도만 콜백으로 냅니다.
 */
export interface DataTableSort {
  /** 정렬 기준. `Column.sortKey ?? Column.key` 와 매칭됩니다. */
  key: string;
  direction: SortDirection;
}

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** 셀 렌더러. 생략 시 row[key] 를 그대로 표시. */
  render?: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /**
   * 고정 너비(CSS 길이 문자열). 주면 `size` 보다 우선합니다.
   * 예: `"12rem"`, `"120px"`, `"20%"`.
   */
  width?: string;
  /**
   * 너비 배분 방식(선택). `width` 가 없을 때만 적용됩니다.
   * - `"fit"`: 내용 폭에 딱 맞춰 줄어듭니다(줄바꿈 없음). 배지·날짜·액션 버튼 열처럼
   *   내용이 짧고 늘어날 필요가 없는 열에 씁니다.
   * - `"grow"`: 남는 가로 공간을 가져갑니다(flex-grow: 1 과 같은 역할).
   *   여러 열에 주면 남는 공간을 나눠 갖습니다.
   * - 생략: 브라우저 기본 배분(내용 비례).
   *
   * 테이블은 항상 컨테이너 전체 폭을 채우므로, `"fit"` 열만 있으면 남는 공간이
   * 결국 어딘가에 배분됩니다. 의도한 열이 늘어나게 하려면 `"grow"` 를 한 개 이상 지정하세요.
   */
  size?: "fit" | "grow";
  /**
   * 헤더를 정렬 버튼으로 렌더합니다. 기본 false.
   * `DataTableProps.onSortChange` 가 함께 있어야 실제로 눌립니다.
   */
  sortable?: boolean;
  /**
   * 정렬 기준 식별자(선택). 생략 시 `key` 를 씁니다.
   * 표시 열과 정렬 키가 다를 때 씁니다(예: `key: "author"`, `sortKey: "author.name"`).
   * 서버 정렬이면 API 가 받는 필드명을 그대로 적습니다.
   */
  sortKey?: string;
  /**
   * 이 열을 처음 눌렀을 때의 방향. 기본 `"asc"`.
   * 날짜·수량처럼 "큰 값 먼저"가 자연스러운 열은 `"desc"` 를 줍니다.
   */
  defaultSortDirection?: SortDirection;
  /**
   * 세로 셀 병합(rowSpan, 선택). 행마다 이 열 셀이 차지할 행 수를 반환합니다.
   * - `n >= 2`: 이 행부터 아래로 n 행을 덮는 병합 셀을 그립니다(현재 페이지 끝을 넘으면 잘림).
   * - 그 외(`1`, `0` 등): 일반 셀.
   *
   * 병합 셀이 덮는 아래 행들은 컴포넌트가 알아서 건너뜁니다. 그 행들에서 무엇을 반환하든
   * 무시되므로 그룹의 첫 행에만 n 을 주면 됩니다(`getRowSpans` 처럼 0 을 줘도 됩니다).
   *
   * 프레젠테이션 전용 원칙에 따라 무엇을 묶을지는 소비 시스템이 계산합니다.
   * `rows` 는 이미 정렬·페이징된 상태이므로 **현재 페이지의 행 기준**으로 계산하세요
   * (`getRowSpans` 헬퍼 참고). `index` 는 현재 페이지 `rows` 안에서의 위치입니다.
   */
  rowSpan?: (row: T, index: number) => number;
}

/**
 * 연속으로 같은 그룹 키를 가진 행을 묶어 rowSpan 배열을 만듭니다(순수 함수).
 * 그룹의 첫 행은 그룹 크기, 나머지는 0 을 받습니다. `Column.rowSpan` /
 * `DataTableProps.selectionRowSpan` 에 `(_, i) => spans[i]` 로 넘기면 됩니다.
 *
 * 연속한 행만 묶으므로, 같은 값끼리 모이게 하려면 먼저 그 키로 정렬하세요.
 */
export function getRowSpans<T>(rows: T[], groupKey: (row: T) => unknown): number[] {
  const spans = new Array<number>(rows.length).fill(0);
  let start = 0;
  for (let i = 1; i <= rows.length; i++) {
    if (i === rows.length || !Object.is(groupKey(rows[i]), groupKey(rows[start]))) {
      spans[start] = i - start;
      start = i;
    }
  }
  return spans;
}

/**
 * rowSpan 콜백을 실제로 그릴 값 배열로 정규화합니다.
 * 병합 셀이 덮는 행은 콜백 반환값과 상관없이 0(생략), 나머지는 1 이상이며
 * 페이지 끝을 넘지 않게 자릅니다. 덮인 행에 1 을 반환하는 실수로 셀이 밀리는 것을 막습니다.
 */
function resolveSpans<T>(
  rows: T[],
  fn: ((row: T, index: number) => number) | undefined,
): number[] | null {
  if (!fn) return null;
  const spans = new Array<number>(rows.length).fill(0);
  let coveredUntil = 0;
  for (let i = 0; i < rows.length; i++) {
    if (i < coveredUntil) continue;
    const raw = Math.floor(fn(rows[i], i));
    const span = raw > 1 ? Math.min(raw, rows.length - i) : 1;
    spans[i] = span;
    coveredUntil = i + span;
  }
  return spans;
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

/** onChange 로 올려주는 "이번에 토글된" 행 1건. id 는 rowKey 값, row 는 원본 데이터. */
export interface DataTableSelectionChange<T> {
  /** rowKey(row) 로 계산된 uniqueId. */
  id: string | number;
  /** 토글된 행의 원본 데이터(현재 페이지의 행). */
  row: T;
  /** 토글 후 상태. true=선택됨, false=해제됨. */
  checked: boolean;
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
   * 선택 열을 맨 왼쪽에 추가합니다. 기본 false.
   * 선택 상태는 컨트롤드입니다 — `value` 로 내려주고 `onChange` 로 올려받습니다(프레젠테이션 전용).
   * 컨트롤 모양은 `selectionMode` 로 정합니다(다중=체크박스, 단일=라디오).
   */
  checkable?: boolean;
  /**
   * 선택 방식. 기본 `"multiple"`.
   * - `"multiple"`: 체크박스. 전체 선택 헤더(부분 선택 시 indeterminate)를 함께 렌더.
   * - `"single"`: 라디오. 한 번에 한 행만 선택되고 전체 선택 헤더는 없습니다.
   *   `value` 에는 0~1개의 id 만 담기며, 새 행을 고르면 이전 선택은 자동으로 대체됩니다.
   */
  selectionMode?: "single" | "multiple";
  /**
   * 선택된 행의 uniqueId 목록(controlled). `rowKey(row)` 값과 매칭됩니다.
   * `checkable` 일 때만 의미가 있습니다. 페이지네이션이 있어도 이 배열은 전체 선택을 담고,
   * 현재 페이지에 없는 선택은 그대로 보존됩니다.
   * `selectionMode="single"` 이면 최대 1개만 담습니다.
   */
  value?: Array<string | number>;
  /**
   * 선택 변경 콜백.
   * - `selectedIds`: 변경이 반영된 "다음 선택 전체"(그대로 `value` 에 넣으면 됩니다).
   *   단일 모드에서는 항상 길이 0~1.
   * - `changed`: 이번 동작에서 토글된 행들. 각 항목이 `{ id(uniqueId), row, checked }`.
   *   다중: 행 클릭이면 1건, 전체 선택/해제면 상태가 실제로 바뀐 행들만 여러 건.
   *   단일: 방금 고른 행 1건(`checked: true`). 이전 선택 해제는 `selectedIds` 로만 반영됩니다.
   *
   * 참고: `row` 원본 데이터는 "현재 페이지에 보이는(=토글 가능한)" 행에 대해서만 제공됩니다.
   * 다른 페이지의 선택은 id 로만 `selectedIds` 에 유지됩니다.
   */
  onChange?: (
    selectedIds: Array<string | number>,
    changed: DataTableSelectionChange<T>[],
  ) => void;
  /**
   * 행별 선택 가능 여부(선택). false 를 반환하면 해당 행의 선택 컨트롤(체크박스/라디오)을
   * 비활성화하고 전체 선택 대상에서도 제외합니다. 예: 자기 자신 계정은 선택 못 하게.
   */
  isRowSelectable?: (row: T) => boolean;
  /**
   * 선택 열 세로 병합(선택). 규칙은 `Column.rowSpan` 과 같습니다(첫 행에 n, 덮이는 행은 자동 생략).
   * 병합된 체크박스는 덮고 있는 행들을 **그룹으로** 다룹니다.
   * - 그룹의 선택 가능한 행이 모두 선택됨 → 체크, 일부만 → indeterminate.
   * - 누르면 그룹 전체를 선택/해제하고, `changed` 에는 상태가 바뀐 행이 모두 담깁니다.
   * - `value` 는 여전히 행 id 단위입니다(그룹 id 가 따로 생기지 않습니다).
   *
   * 다중 선택(`selectionMode="multiple"`)에서만 적용됩니다. 단일 선택은 한 행만 고를 수 있어
   * 그룹 선택과 맞지 않으므로 무시하고 행마다 라디오를 그립니다.
   * 생략하면 기존처럼 행마다 선택 컨트롤을 그립니다.
   */
  selectionRowSpan?: (row: T, index: number) => number;
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
   * 현재 정렬 상태(controlled). `null`/생략이면 정렬 없음.
   * 어느 열과도 매칭되지 않는 `key` 는 조용히 무시합니다.
   */
  sort?: DataTableSort | null;
  /**
   * 정렬 변경 요청. 인자는 "다음 정렬 상태 전체"라 그대로 `sort` 에 넣으면 됩니다.
   * 이 콜백이 없으면 `sortable` 열도 눌리지 않는 정적 헤더로 렌더합니다.
   *
   * 참고: 정렬이 바뀔 때 페이지를 1로 되돌리는 것은 소비 시스템의 책임입니다.
   */
  onSortChange?: (next: DataTableSort | null) => void;
  /**
   * 같은 열을 계속 누를 때 정렬 해제 단계를 포함할지. 기본 false.
   * - false: `기본 방향 ⇄ 반대 방향` 2단계
   * - true: `기본 방향 → 반대 방향 → 해제(null)` 3단계
   */
  sortClearable?: boolean;
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

/** 정렬 헤더는 flex 버튼이라 text-align 대신 justify 로 정렬 위치를 맞춥니다. */
const justifyClass = {
  left: "justify-start",
  right: "justify-end",
  center: "justify-center",
} as const;

/**
 * 헤더를 눌렀을 때의 "다음 정렬 상태"를 계산합니다.
 *
 * 다른 열이면 그 열의 기본 방향으로 시작하고, 같은 열이면 반대 방향으로 뒤집습니다.
 * `clearable` 이면 한 바퀴 돈 뒤 정렬 해제(null)로 빠집니다.
 * UI 토글 규칙일 뿐이라 컴포넌트가 갖되, 실제 행 재배열은 소비 시스템의 몫입니다.
 */
function nextSort<T>(
  col: Column<T>,
  current: DataTableSort | null | undefined,
  clearable: boolean,
): DataTableSort | null {
  const key = col.sortKey ?? col.key;
  const first = col.defaultSortDirection ?? "asc";
  const second: SortDirection = first === "asc" ? "desc" : "asc";
  if (!current || current.key !== key) return { key, direction: first };
  if (current.direction === first) return { key, direction: second };
  return clearable ? null : { key, direction: first };
}

/**
 * 정렬 인디케이터.
 * 비활성 상태에서도 자리를 그대로 차지해야(투명도만 조절) hover 시 헤더 폭이 흔들리지 않습니다.
 * `size: "fit"` 열은 헤더 폭이 곧 열 폭이라 특히 중요합니다.
 */
function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  const Icon = !active ? IconArrowUpDown : direction === "asc" ? IconArrowUp : IconArrowDown;
  return (
    <Icon
      width={14}
      height={14}
      className={cn(
        "shrink-0 transition-opacity",
        active
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-40 group-focus-visible:opacity-40",
      )}
    />
  );
}

/**
 * 열 너비를 CSS `width` 값으로 환산합니다.
 *
 * 테이블 레이아웃(`table-layout: auto` + `w-full`)에서는 flexbox 가 아니라 셀 너비 힌트로
 * 배분이 정해집니다. 그래서 `"fit"` 은 최소 폭(`1%`, 실제로는 내용 폭까지만 줄어듦),
 * `"grow"` 는 최대 폭(`100%`, 남는 공간을 흡수)으로 옮깁니다.
 * 셀은 헤더·본문 모두 `whitespace-nowrap` 이라 내용 폭이 그대로 유지됩니다.
 */
function widthStyle<T>(col: Column<T>): string | undefined {
  if (col.width) return col.width;
  if (col.size === "fit") return "1%";
  if (col.size === "grow") return "100%";
  return undefined;
}

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
  sort,
  onSortChange,
  sortClearable = false,
  fillHeight = false,
  checkable = false,
  selectionMode = "multiple",
  value,
  onChange,
  isRowSelectable,
  selectionRowSpan,
}: DataTableProps<T>) {
  // 같은 페이지에 여러 테이블이 있어도 라디오 그룹이 섞이지 않도록 고유 name 을 만듭니다.
  const radioName = useId();
  const single = selectionMode === "single";
  const selectedSet = new Set(value ?? []);
  // 전체 선택 계산은 "현재 페이지의 선택 가능한 행"만 대상으로 합니다.
  const selectableRows = rows.filter((row) => isRowSelectable?.(row) ?? true);
  // 전체 선택 헤더는 다중 모드에서만 씁니다.
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((row) => selectedSet.has(rowKey(row)));
  const someSelected = selectableRows.some((row) => selectedSet.has(rowKey(row)));
  const indeterminate = someSelected && !allSelected;

  /** changed 목록을 현재 value 에 반영한 "다음 선택 전체"를 계산해 콜백으로 냅니다(다중). */
  function emitChange(changed: DataTableSelectionChange<T>[]) {
    if (!onChange || changed.length === 0) return;
    // Set 삽입 순서 = 기존 value 순서 + 새로 추가된 순서(안정적).
    const next = new Set(value ?? []);
    for (const c of changed) {
      if (c.checked) next.add(c.id);
      else next.delete(c.id);
    }
    onChange(Array.from(next), changed);
  }

  function toggleRow(row: T) {
    const id = rowKey(row);
    emitChange([{ id, row, checked: !selectedSet.has(id) }]);
  }

  /** 여러 행을 한꺼번에 target 상태로 맞춥니다. 상태가 실제로 바뀌는 행만 changed 에 담습니다. */
  function setRows(targetRows: T[], target: boolean) {
    const changed = targetRows
      .filter((row) => selectedSet.has(rowKey(row)) !== target)
      .map((row) => ({ id: rowKey(row), row, checked: target }));
    emitChange(changed);
  }

  function toggleAll() {
    setRows(selectableRows, !allSelected);
  }

  // 선택 열 병합은 다중 모드에서만 씁니다(단일 모드는 한 행만 고르므로 그룹 선택과 맞지 않음).
  const selectionSpans = resolveSpans(rows, !single ? selectionRowSpan : undefined);
  const columnSpans = columns.map((col) => resolveSpans(rows, col.rowSpan));

  /** 단일 선택: 고른 행으로 전체를 대체합니다(이전 선택은 selectedIds 로만 해제). */
  function selectSingle(row: T) {
    const id = rowKey(row);
    if (selectedSet.has(id)) return; // 이미 선택된 라디오 재클릭은 무시(표준 동작).
    onChange?.([id], [{ id, row, checked: true }]);
  }

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
              {checkable && (
                <th
                  style={{ width: "1%" }}
                  className={cn(
                    "w-px whitespace-nowrap px-4 py-2.5 text-center align-middle",
                    fillHeight &&
                      "sticky top-0 z-10 bg-surface-muted shadow-[inset_0_-1px_0_var(--au-color-border)]",
                  )}
                >
                  {/* 전체 선택은 다중 모드에서만. 단일 모드는 헤더 자리만 비웁니다. */}
                  {!single && (
                    <Checkbox
                      aria-label="전체 선택"
                      checked={allSelected}
                      indeterminate={indeterminate}
                      disabled={selectableRows.length === 0}
                      onChange={toggleAll}
                    />
                  )}
                </th>
              )}
              {columns.map((col) => {
                // 정렬은 controlled 라 콜백이 없으면 누를 수 없는 정적 헤더로 둡니다.
                const interactive = Boolean(col.sortable && onSortChange);
                const active = Boolean(sort && sort.key === (col.sortKey ?? col.key));
                const align = col.align ?? "left";
                return (
                  <th
                    key={col.key}
                    style={{ width: widthStyle(col) }}
                    aria-sort={
                      active
                        ? sort?.direction === "asc"
                          ? "ascending"
                          : "descending"
                        : col.sortable
                          ? "none"
                          : undefined
                    }
                    className={cn(
                      "whitespace-nowrap font-medium text-text-muted",
                      // 정렬 열은 셀 전체가 클릭 영역이 되도록 패딩을 버튼이 가져갑니다.
                      interactive ? "p-0" : "px-4 py-2.5",
                      alignClass[align],
                      // border-collapse 에서는 sticky 헤더의 아래 테두리가 스크롤 시
                      // 사라지므로 inset box-shadow 로 구분선을 보강한다.
                      fillHeight &&
                        "sticky top-0 z-10 bg-surface-muted shadow-[inset_0_-1px_0_var(--au-color-border)]",
                    )}
                  >
                    {interactive ? (
                      <button
                        type="button"
                        onClick={() => onSortChange?.(nextSort(col, sort, sortClearable))}
                        className={cn(
                          "group flex w-full select-none items-center gap-1 px-4 py-2.5",
                          "transition-colors hover:text-text",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                          justifyClass[align],
                          active && "text-text",
                        )}
                      >
                        <span>{col.header}</span>
                        <SortIndicator
                          active={active}
                          direction={sort?.direction ?? "asc"}
                        />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-b border-line last:border-0">
                  {checkable && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-4 animate-pulse rounded bg-surface-muted" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3">
                      {/* fit 열은 스켈레톤이 셀 폭을 결정해 버리므로 고정 폭으로 그립니다. */}
                      <div
                        className={cn(
                          "h-4 animate-pulse rounded bg-surface-muted",
                          col.size === "fit" ? "w-16" : "w-full max-w-[160px]",
                        )}
                      />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              !error &&
              rows.map((row, rowIndex) => {
                const selectionSpan = selectionSpans ? selectionSpans[rowIndex] : 1;
                // 병합된 체크박스가 덮는 행들(자기 자신 포함) 중 선택 가능한 행만 그룹으로 다룹니다.
                const group =
                  selectionSpan > 1
                    ? rows
                        .slice(rowIndex, rowIndex + selectionSpan)
                        .filter((r) => isRowSelectable?.(r) ?? true)
                    : [];
                const groupAll =
                  group.length > 0 && group.every((r) => selectedSet.has(rowKey(r)));
                const groupSome = group.some((r) => selectedSet.has(rowKey(r)));
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "border-b border-line last:border-0",
                      onRowClick && "cursor-pointer hover:bg-surface-muted",
                      rowClassName?.(row),
                    )}
                  >
                    {checkable && selectionSpan > 0 && (
                      <td
                        rowSpan={selectionSpan > 1 ? selectionSpan : undefined}
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-center align-middle",
                          // 병합 셀은 아래 행들과 맞닿는 쪽에 구분선을 둡니다.
                          selectionSpan > 1 && "border-r border-line",
                        )}
                        // 선택 컨트롤 클릭이 행 클릭(onRowClick)까지 번지지 않게 막습니다.
                        onClick={(e) => e.stopPropagation()}
                      >
                        {selectionSpan > 1 ? (
                          <Checkbox
                            aria-label={`${selectionSpan}개 행 선택`}
                            checked={groupAll}
                            indeterminate={groupSome && !groupAll}
                            disabled={group.length === 0}
                            onChange={() => setRows(group, !groupAll)}
                          />
                        ) : single ? (
                          <input
                            type="radio"
                            name={radioName}
                            aria-label="행 선택"
                            checked={selectedSet.has(rowKey(row))}
                            disabled={!(isRowSelectable?.(row) ?? true)}
                            onChange={() => selectSingle(row)}
                            className={cn(
                              "h-4 w-4 shrink-0 border-line accent-primary",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                              (isRowSelectable?.(row) ?? true)
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-60",
                            )}
                          />
                        ) : (
                          <Checkbox
                            aria-label="행 선택"
                            checked={selectedSet.has(rowKey(row))}
                            disabled={!(isRowSelectable?.(row) ?? true)}
                            onChange={() => toggleRow(row)}
                          />
                        )}
                      </td>
                    )}
                    {columns.map((col, colIndex) => {
                      const span = columnSpans[colIndex]?.[rowIndex] ?? 1;
                      // 0 은 위쪽 병합 셀이 덮는 자리라 셀을 그리지 않습니다.
                      if (span === 0) return null;
                      return (
                        <td
                          key={col.key}
                          rowSpan={span > 1 ? span : undefined}
                          className={cn(
                            // 셀 내용은 항상 한 줄로 유지합니다(넘치면 컨테이너가 가로 스크롤).
                            "whitespace-nowrap px-4 py-3 text-text",
                            alignClass[col.align ?? "left"],
                            // 병합 셀은 양옆 행들과 맞닿으므로 세로 구분선을 둡니다.
                            span > 1 && "border-x border-line first:border-l-0 last:border-r-0",
                          )}
                        >
                          {col.render
                            ? col.render(row)
                            : String((row as Record<string, unknown>)[col.key] ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
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
