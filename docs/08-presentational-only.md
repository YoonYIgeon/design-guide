# 08. 프레젠테이션 전용 원칙 (Presentational-Only)

> **이 라이브러리의 모든 컴포넌트는 "그리는 역할"만 한다.**
> 데이터 패칭·전역 상태·비즈니스 로직·라우팅·영속화와 절대 엮이지 않는다.

이 원칙은 협상 대상이 아닙니다. 컴포넌트가 데이터와 결합되는 순간, 여러 소비 시스템에서
재사용할 수 없고, 격리망·테스트·교체가 어려워집니다.

## 무엇을 해야 하나 (Do)

- **props 로 받는다**: 표시할 값은 전부 props 로 주입받는다.
- **callback 으로 내보낸다**: 사용자 상호작용은 `onClick`, `onSubmit`, `onChange`, `onDeleteUser` 같은
  콜백으로 "의도"만 전달한다. 실제 처리는 호출한 쪽이 한다.
- **순수 UI 상태만 보유한다**: 모달 열림/닫힘, 입력값, 호버/포커스, 펼침 여부 등 화면 표현에
  한정된 상태만 컴포넌트 안에 둔다.
- **상태를 표현한다**: 로딩/빈/에러/비활성은 `loading`, `error`, `disabled` 같은 props 로
  받아 "그리기"만 한다. 그 값이 참인지 아닌지는 판단하지 않는다.

## 무엇을 하면 안 되나 (Don't)

컴포넌트 내부에서 다음을 **금지**한다.

- `fetch` / `axios` 등 **HTTP 호출**
- `react-query`, 전역 스토어(Redux 등) 접근, `localStorage`/쿠키 **영속화**
- 라우팅 이동(`navigate`), URL 조작
- 도메인 규칙 계산(권한 판정, 금액 계산, 검색 필터링 등 **비즈니스 로직**)
- 환경변수(`import.meta.env`)로 동작 분기

이런 로직은 **소비 시스템(컨테이너)**의 몫이다.

## 책임 분리

| 구분 | 담당 | 위치 |
| --- | --- | --- |
| **그리기 (프레젠테이션)** | 이 라이브러리 | `src/lib/**` |
| 데이터 패칭·상태·비즈니스 로직 | 소비 시스템(컨테이너) | 각 사내 애플리케이션 |
| 데모/프리뷰 (정적 예시 주입) | 이 저장소의 하네스 | `src/App.tsx`, `src/pages/**` |

`src/App.tsx`와 `src/pages/**`는 **라이브러리가 아니라** 컴포넌트를 눈으로 확인하기 위한
프리뷰 하네스다. 여기서 쓰는 목록/통계는 네트워크가 아닌 **정적 예시 데이터**이며,
실제 소비 시스템은 이 자리에 자신의 데이터 계층(예: react-query + axios)을 연결한다.

## 예시

### ❌ 나쁨 — 컴포넌트가 데이터를 가져온다

```tsx
// 라이브러리 컴포넌트 안에서 직접 패칭 — 금지
function UserTable() {
  const { data, isLoading } = useQuery(["users"], () => axios.get("/users"));
  return <table>{/* ... */}</table>;
}
```

### ✅ 좋음 — 값은 props, 의도는 callback

```tsx
// 라이브러리: 그리기만
interface UserTableProps {
  users: UserRow[];
  loading?: boolean;
  error?: string | null;
  onDeleteUser: (id: number) => void;
}
function UserTable({ users, loading, error, onDeleteUser }: UserTableProps) {
  return <DataTable rows={users} loading={loading} error={error} /* ... */ />;
}
```

```tsx
// 소비 시스템(컨테이너): 데이터는 여기서
function UsersContainer() {
  const { data, isLoading, error } = useUsers();        // react-query 등
  const del = useDeleteUser();
  return (
    <UserTable
      users={data ?? []}
      loading={isLoading}
      error={error ? "목록을 불러오지 못했습니다." : null}
      onDeleteUser={(id) => del.mutate(id)}
    />
  );
}
```

## 왜 이렇게 하나

- **재사용성**: 데이터 소스가 무엇이든(다른 사내 시스템, 다른 API) 같은 컴포넌트를 쓴다.
- **격리망 적합성**: UI 라이브러리는 네트워크를 모르므로, 배포·버전·롤백이 데이터와 무관하게 단순해진다.
- **테스트 용이**: props 만 넣으면 모든 상태(로딩/빈/에러)를 결정적으로 렌더해 검증할 수 있다.
- **관심사 분리**: 화면 변경과 데이터 변경이 서로를 오염시키지 않는다.

## 리뷰 기준

PR 리뷰 시 다음을 확인한다(자세한 체크리스트는 [07-contributing.md](07-contributing.md)).

- [ ] `src/lib/**` 안에 `fetch`/`axios`/`react-query`/스토어/`localStorage`/라우팅이 없다.
- [ ] 표시 값은 props, 상호작용은 callback 으로만 오간다.
- [ ] 컴포넌트가 보유한 상태는 순수 UI 상태뿐이다.
- [ ] 비즈니스 규칙(필터/계산/권한 판정)이 컴포넌트에 들어있지 않다.
