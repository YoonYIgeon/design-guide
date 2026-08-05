# 기획 — DataTable 정렬(sortable)

> 상태: 기획(구현 전) · 대상: `src/lib/components/DataTable.tsx`

## 1. 목표와 원칙

목록 테이블의 헤더를 눌러 정렬 기준을 바꿀 수 있게 한다.

**핵심 결정: DataTable 은 행을 정렬하지 않는다.** 페이지네이션과 완전히 같은 계약이다
([08-presentational-only.md](../08-presentational-only.md)).

| | 라이브러리(`DataTable`) | 소비 시스템(컨테이너) |
| --- | --- | --- |
| 정렬 상태 보유 | ✗ | ✓ (`useState`) |
| 정렬 인디케이터 그리기 | ✓ | ✗ |
| 헤더 클릭 → "다음 정렬" 계산 | ✓ (토글 규칙만) | ✗ |
| 실제 행 재배열 / API `?sort=` | ✗ | ✓ |

`rows` 에는 **이미 정렬된 현재 페이지의 행**만 넘긴다. 클라이언트 정렬이면 소비 측에서
`useMemo` 로 sort → slice, 서버 정렬이면 정렬 파라미터를 붙여 fetch 한다.

## 2. 공개 API

### 2-1. `Column<T>` 추가 필드

```ts
export interface Column<T> {
  // ...기존 필드

  /** 헤더를 정렬 버튼으로 렌더합니다. 기본 false. */
  sortable?: boolean;
  /**
   * 정렬 기준 식별자(선택). 생략 시 `key` 를 씁니다.
   * 표시 열과 정렬 키가 다를 때 씁니다. 예: `key: "author"`, `sortKey: "author.name"`.
   * 서버 정렬이면 API 가 받는 필드명을 그대로 적습니다.
   */
  sortKey?: string;
  /**
   * 이 열을 처음 눌렀을 때의 방향. 기본 `"asc"`.
   * 날짜·수량처럼 "큰 값 먼저"가 자연스러운 열은 `"desc"` 를 줍니다.
   */
  defaultSortDirection?: SortDirection;
}
```

### 2-2. `DataTableProps<T>` 추가 필드

```ts
export type SortDirection = "asc" | "desc";

export interface DataTableSort {
  /** 정렬 기준. `Column.sortKey ?? Column.key` 와 매칭됩니다. */
  key: string;
  direction: SortDirection;
}

export interface DataTableProps<T> {
  // ...기존 필드

  /**
   * 현재 정렬 상태(controlled). `null`/생략이면 정렬 없음.
   * `checkable` 의 `value` 와 같은 층위입니다 — 상태는 소비 시스템이 보유합니다.
   */
  sort?: DataTableSort | null;
  /**
   * 정렬 변경 요청. 인자는 "다음 정렬 상태 전체"라 그대로 `sort` 에 넣으면 됩니다.
   * 이 콜백이 없으면 `sortable` 열도 클릭할 수 없는 정적 헤더로 렌더합니다.
   */
  onSortChange?: (next: DataTableSort | null) => void;
  /**
   * 같은 열을 계속 누를 때 정렬 해제 단계를 포함할지. 기본 false.
   * - false: `asc ⇄ desc` 2단계
   * - true: `asc → desc → 해제(null)` 3단계
   */
  sortClearable?: boolean;
}
```

**의도적으로 넣지 않는 것**

- `defaultSort`(비제어) — 라이브러리 전체가 controlled 일관. 넣지 않는다.
- 다중 열 정렬 — v1 제외. 필요해지면 `sort` 를 `DataTableSort | DataTableSort[]` 로
  넓히는 방향이라 지금 API 를 바꾸지 않아도 된다.
- 정렬 비교 함수(`Column.comparator`) — 도메인 규칙이라 소비 시스템의 몫.

### 2-3. 토글 규칙 (컴포넌트 내부, 순수 계산)

| 지금 상태 | 클릭한 열 | 다음 |
| --- | --- | --- |
| 없음 / 다른 열 | A | `{ key: A, direction: A.defaultSortDirection ?? "asc" }` |
| `A asc` | A | `A desc` |
| `A desc` | A | `sortClearable` ? `null` : `A asc` |

"다음 정렬 상태" 계산은 UI 토글 규칙일 뿐 비즈니스 로직이 아니므로 컴포넌트가 갖는다
(체크박스 `emitChange` 가 다음 선택 전체를 계산해 내보내는 것과 동일).

## 3. 렌더링 / 마크업

```tsx
<th
  aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
  style={{ width: widthStyle(col) }}
  className={cn("whitespace-nowrap font-medium text-text-muted", ...)}
>
  {interactive ? (
    <button
      type="button"
      onClick={() => onSortChange(nextSort(col, sort, sortClearable))}
      className={cn(
        "-mx-1 flex w-full items-center gap-1 rounded px-1 py-0.5 select-none",
        "hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        justifyClass[col.align ?? "left"],
        active && "text-text",
      )}
    >
      <span>{col.header}</span>
      <SortIndicator active={active} direction={dir} />
    </button>
  ) : (
    col.header
  )}
</th>
```

**세부 규칙**

- `<th>` 의 `aria-sort` 로 스크린리더에 상태를 알린다. 아이콘은 `aria-hidden`.
- 정렬 컨트롤은 **`<button type="button">`** — 키보드 접근·포커스 링이 공짜로 따라온다
  (`type` 생략 시 `<form>` 안에서 제출되는 문제는 [04-ui-guidelines.md](../04-ui-guidelines.md) 참조).
- 패딩은 `<th>` 가 아니라 버튼이 가져가야 클릭 영역이 셀 전체가 된다.
  기존 `px-4 py-2.5` 를 `<th>` 에 두고 버튼에 `-mx-4 px-4 w-full` 로 넓히는 방식으로 정리.
- `align` → `justify-start | center | end` 매핑. 아이콘은 항상 라벨 **뒤**에 붙인다.
- **인디케이터 자리는 항상 차지한다.** 비활성 상태에서 `opacity-0` 로 숨기되 폭은 유지해야
  hover 시 헤더 폭이 흔들리지 않는다. `size: "fit"` 열은 헤더 폭이 열 폭을 정하므로 특히 중요.
- 색은 `--au-*` 토큰 유틸만 사용(`text-text-muted` → 활성/hover 시 `text-text`).

### 인디케이터 3상태

| 상태 | 표시 |
| --- | --- |
| 정렬 가능하지만 비활성 | `IconArrowUpDown`, `opacity-0` → hover/focus 시 `opacity-40` |
| 활성 · asc | `IconArrowUp`, `text-text` |
| 활성 · desc | `IconArrowDown`, `text-text` |

`src/lib/icons/index.tsx` 에 `IconArrowUp` / `IconArrowDown` / `IconArrowUpDown` 3개 추가
(기존 아이콘과 같은 인라인 SVG, 외부 CDN 금지).

## 4. 기존 기능과의 상호작용

| 대상 | 처리 |
| --- | --- |
| `checkable` 헤더 열 | 정렬 대상 아님. 지금 마크업 그대로. |
| `fillHeight`(sticky 헤더) | 버튼은 `<th>` 안이라 sticky·shadow 처리 영향 없음. |
| `pagination` | **정렬 변경 시 1페이지로 되돌리는 건 소비 시스템 책임.** 문서에 명시한다. |
| `loading` | 헤더는 계속 눌린다(다시 불러오는 중에도 정렬 요청 가능). 인디케이터는 유지. |
| `error` / 빈 상태 | 헤더는 그대로 렌더되므로 추가 처리 없음. |
| `onRowClick` | 헤더 클릭은 행 밖이라 간섭 없음. |
| `sort.key` 가 어느 열과도 안 맞음 | 조용히 무시(인디케이터 미표시). 예외를 던지지 않는다. |

## 5. 소비 측 사용 예 (문서/데모에 실을 것)

```tsx
const [sort, setSort] = useState<DataTableSort | null>({ key: "createdAt", direction: "desc" });
const [page, setPage] = useState(1);

// 클라이언트 정렬: 비교자는 소비 시스템의 몫
const sorted = useMemo(() => {
  if (!sort) return rows;
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => compareBy(sort.key, a, b) * dir);
}, [rows, sort]);

<DataTable
  columns={columns}          // { key: "name", header: "이름", sortable: true } ...
  rows={sorted.slice((page - 1) * 20, page * 20)}
  rowKey={(r) => r.id}
  sort={sort}
  onSortChange={(next) => {
    setSort(next);
    setPage(1);              // 정렬이 바뀌면 1페이지로 — 소비 시스템 책임
  }}
/>
```

서버 정렬이면 `onSortChange` 에서 쿼리 파라미터만 바꾸고 `rows` 는 응답을 그대로 넘긴다.

## 6. 작업 목록

1. `src/lib/icons/index.tsx` — `IconArrowUp` / `IconArrowDown` / `IconArrowUpDown` 추가
2. `src/lib/components/DataTable.tsx`
   - `SortDirection` / `DataTableSort` 타입, `Column` · `DataTableProps` 필드 추가
   - `nextSort()` 순수 함수, `justifyClass` 맵, `SortIndicator` 내부 컴포넌트
   - `<thead>` 헤더 셀 렌더 분기 (패딩을 버튼으로 이전)
3. `src/lib/index.ts` — `type SortDirection`, `type DataTableSort` export
4. `src/pages/DashboardPage.tsx` — 정렬 상태 + `useMemo` 비교자로 데모 (이름·가입일 열)
5. 문서
   - `docs/04-ui-guidelines.md` — 정렬 열 지정 규칙, 페이지 리셋은 소비 측 책임
   - `docs/08-presentational-only.md` — "정렬도 페이지네이션과 같은 계약" 한 줄
   - `README.md` 컴포넌트 표 · `CHANGELOG.md` (minor: 하위 호환 추가)
6. `yarn build` (타입체크 포함) + `yarn preview` 로 눈으로 확인

## 7. 확인용 시나리오

- [ ] `sortable` 없는 기존 사용처는 마크업·폭이 그대로다(회귀 없음)
- [ ] 헤더 Tab 이동 → Enter/Space 로 정렬 토글, 포커스 링 보임
- [ ] `aria-sort` 가 none/ascending/descending 으로 바뀐다
- [ ] hover 로 인디케이터가 나타나도 열 폭이 흔들리지 않는다(`size: "fit"` 열 포함)
- [ ] `align: "right"` 열에서 라벨·아이콘이 오른쪽에 붙는다
- [ ] `fillHeight` sticky 헤더에서 배경·구분선이 유지된다
- [ ] `sortClearable` 로 3단계 토글이 동작한다
- [ ] `onSortChange` 를 안 주면 헤더가 눌리지 않는다
