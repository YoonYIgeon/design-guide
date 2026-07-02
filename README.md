# Admin UI Library (design-guide)

**철저히 분리된(격리된) 외부 사내 시스템**에서 사용하는 **관리자 페이지 전용 UI 라이브러리**입니다.
공개 패키지 레지스트리(npm 등)에 의존하지 않고 **Git을 통해 수시로 배포·업데이트**되는 것을 전제로 설계·운영합니다.

> 이 저장소는 라이브러리의 **소스와 가이드 문서**를 함께 관리합니다.
> 소비 시스템(관리자 페이지를 사용하는 사내 애플리케이션)은 이 저장소를 **Git 의존성 / 서브모듈 / 배포 아티팩트** 형태로 참조합니다.

---

## 이 라이브러리가 해결하는 문제

- **격리 환경 제약**: 대상 시스템은 외부 네트워크(공용 npm 레지스트리, CDN)에 접근할 수 없거나 접근을 제한합니다. 따라서 의존성 배포는 **내부 Git**을 1차 경로로 삼습니다.
- **잦은 업데이트**: 관리자 화면은 정책·운영 요구에 따라 자주 바뀝니다. 릴리스 절차가 무겁지 않으면서도 **버전 추적과 롤백**이 가능해야 합니다.
- **일관성**: 여러 관리자 화면·시스템이 동일한 UI 규칙(컴포넌트, 토큰, 레이아웃)을 공유해 유지보수 비용을 낮춥니다.

## 핵심 원칙

1. **프레젠테이션 전용(UI-only)** — 모든 컴포넌트는 "그리는 역할"만 한다. 데이터 패칭·상태·비즈니스 로직과 엮이지 않는다. 값은 props 로 받고, 상호작용은 callback 으로 내보낸다. → [docs/08-presentational-only.md](docs/08-presentational-only.md)
   - **유연한 합성** — 표시용 자리는 문자열이 아니라 `ReactNode` 로 받고, 기본 렌더가 있는 자리는 대체 슬롯을 연다. → [docs/11-flexible-composition.md](docs/11-flexible-composition.md)
2. **Git이 진실의 원천(Single Source of Truth)** — 배포·버전·롤백 모두 Git 태그/커밋 기준.
3. **외부 의존 최소화** — 런타임/빌드 의존성은 격리 환경에서 재현 가능해야 함(벤더링 또는 내부 미러 우선).
4. **하위 호환 우선** — 소비 시스템이 여러 개일 수 있으므로 파괴적 변경은 SemVer와 마이그레이션 가이드로 관리.
5. **문서가 곧 계약** — 컴포넌트 API와 디자인 규칙은 `docs/`에 명시하고, 코드와 함께 리뷰.

---

## 문서 안내

| 문서 | 내용 |
| --- | --- |
| [docs/01-overview.md](docs/01-overview.md) | 프로젝트 목표, 범위, 용어 정의 |
| [docs/02-architecture.md](docs/02-architecture.md) | 격리 환경 아키텍처, Git 기반 배포 구조 |
| [docs/03-getting-started.md](docs/03-getting-started.md) | 소비 시스템에서 설치·연동하는 방법 |
| [docs/04-ui-guidelines.md](docs/04-ui-guidelines.md) | 디자인 토큰·컴포넌트·접근성 규칙 |
| [docs/05-git-workflow.md](docs/05-git-workflow.md) | 브랜치 전략, 수시 업데이트/배포 워크플로우 |
| [docs/06-versioning-release.md](docs/06-versioning-release.md) | SemVer, 태깅, 릴리스, 롤백 |
| [docs/07-contributing.md](docs/07-contributing.md) | 기여 규칙, 커밋 컨벤션, 리뷰 |
| [docs/08-presentational-only.md](docs/08-presentational-only.md) | **프레젠테이션 전용 원칙** (데이터와 분리, props/callback 계약) |
| [docs/09-data-fetching.md](docs/09-data-fetching.md) | **데이터 패칭** (axios·react-query·react-markdown, API 관리/페이지 예시) |
| [docs/10-form-inputs.md](docs/10-form-inputs.md) | **폼 입력 컴포넌트** (Select·Checkbox·Radio·FileUpload, 파일 업로드 API 동적 연동) |
| [docs/11-flexible-composition.md](docs/11-flexible-composition.md) | **유연한 합성** (표시 자리는 `ReactNode`, 대체 슬롯, 구조화 객체 \| node) |

## 데모 앱 실행 (개발자)

이 저장소에는 라이브러리와 함께 동작을 확인할 수 있는 **관리자 데모 앱**(React + Vite + Tailwind)이 포함되어 있습니다.

> **패키지 매니저는 yarn 을 사용합니다(필수). npm 을 쓰지 마세요.** → [CLAUDE.md](CLAUDE.md)

```bash
yarn install
yarn dev        # 개발 서버 (http://localhost:5173)
yarn build      # 타입체크 + 프로덕션 빌드
yarn typecheck  # 타입만 검사
```

데모 화면: 사이드바 내비게이션, 대시보드 지표 카드, 사용자 관리 테이블(검색·삭제),
사용자 추가 모달, 로그인 폼, 라이트/다크 테마 토글.

> `src/App.tsx`·`src/pages/**`는 **라이브러리가 아니라 프리뷰 하네스**입니다.
> 여기서 쓰는 데이터는 네트워크가 아닌 **정적 예시**이며, 라이브러리 컴포넌트는 데이터를 모릅니다.

라우트 (react-router-dom, 하네스에서만 구성):

| 경로 | 화면 |
| --- | --- |
| `/login` | 로그인 (미인증 진입점) |
| `/` | 대시보드 (지표 + 사용자 관리) |
| `/posts` | 게시글 (axios·react-query·react-markdown 데이터 패칭 예시) → [docs/09](docs/09-data-fetching.md) |
| `/forms` | 입력 폼 (Select·Checkbox·Radio·FileUpload + 파일 업로드 API 동적 연동) → [docs/10](docs/10-form-inputs.md) |
| `/users` · `/audit` · `/settings` | 각 관리 화면 |

미인증 상태로 보호 경로에 접근하면 `/login` 으로 리다이렉트됩니다. `AdminShell` 은 라우터를 모르며
`activeKey`/`onNavigate` props 로만 연결됩니다.

### 구현된 컴포넌트 (`src/lib`)

| 컴포넌트 | 설명 |
| --- | --- |
| `AdminShell` | 사이드바 + 상단바 + 콘텐츠 공통 레이아웃 |
| `DataTable` | 제네릭 목록 테이블 (loading/empty/error 상태) |
| `Button` | primary/secondary/danger/ghost, loading |
| `Input` | 레이블·힌트·에러를 A11y 속성과 연결 |
| `Select` / `Checkbox` / `RadioGroup` | 선택형 입력 (레이블·힌트·에러·A11y, indeterminate 지원) |
| `FileUpload` | 드래그&드롭 파일 업로드 (API 연동 시 업로드 결과 `{ url, name }` 반영) |
| `Modal` | ESC/오버레이 닫기, 포커스 이동·복귀 |
| `Card` / `StatCard` | 콘텐츠 컨테이너 / 지표 카드 |
| `Badge` | 의미색 상태 배지 |
| `EmptyState` | 빈 데이터 안내 |
| `Markdown` | 마크다운 → React 렌더링 (react-markdown, 토큰 스타일) |
| `LoginForm` | 프레젠테이션 전용 로그인 폼 (onSubmit 으로 값만 전달) |
| `Icons` | 인라인 SVG 아이콘 (외부 CDN 미사용) |

모든 컴포넌트는 **props 로 값을 받고 callback 으로 상호작용을 내보내는** 프레젠테이션 전용입니다.
디자인 토큰은 `src/lib/tokens.css`의 CSS 변수(`--au-*`)가 원천이며, 소비 시스템은 `:root`에서 덮어써 테마를 조정합니다.

### 데이터 연결은 소비 시스템의 몫

이 라이브러리는 **데이터를 가져오지 않습니다.** HTTP 호출·상태 관리·비즈니스 로직은
소비 시스템(컨테이너)에서 처리하고, 결과를 컴포넌트에 props 로 주입합니다.

```tsx
// 소비 시스템(컨테이너) — 데이터는 여기서 (예: react-query + axios)
function UsersContainer() {
  const { data, isLoading, error } = useUsers();
  const del = useDeleteUser();
  return (
    <DashboardPage
      users={data ?? []}
      loading={isLoading}
      error={error ? "목록을 불러오지 못했습니다." : null}
      onDeleteUser={(id) => del.mutate(id)}
      /* ... */
    />
  );
}
```

자세한 계약과 Do/Don't 는 [docs/08-presentational-only.md](docs/08-presentational-only.md) 참고.

## 빠른 시작 (소비 시스템 관점)

```bash
# 내부 Git URL을 의존성으로 추가 (예: package.json)
#   "@company/admin-ui": "git+https://git.internal.company/design-guide.git#v1.4.0"
yarn install
```

자세한 연동 방법은 [docs/03-getting-started.md](docs/03-getting-started.md)를 참고하세요.

> **참고**: 기술 스택(React/Vue, 번들러, 배포 형태 등)은 팀 결정에 맞춰 조정 가능한 **권장 기본값**으로 문서에 표기했습니다. 확정 사항이 있으면 해당 문서를 갱신하세요.
