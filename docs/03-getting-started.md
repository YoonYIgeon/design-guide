# 03. 시작하기 (Getting Started) — 소비 시스템 연동

소비 시스템(사내 관리자 앱)에서 이 라이브러리를 사용하는 방법입니다.
격리 환경 특성상 **버전은 항상 고정 참조(태그/커밋)**로 지정합니다.

> **포크하지 마세요.** 포크하면 upstream 이 바뀔 때마다 병합/재작업이 생깁니다.
> 라이브러리는 아래처럼 **패키지 의존성**으로 설치하고, 앱 골격(하네스)은
> [하네스 템플릿 복사](#하네스-템플릿-복사-최초-1회)로 **한 번만** 가져가 완전히 소유하세요.
> 이후 upstream 업데이트는 "태그 버전 올리기"로 끝납니다.

## 1) 설치 — 내부 Git 태그를 의존성으로 참조 (권장)

`package.json`:

```jsonc
{
  "dependencies": {
    "@company/admin-ui": "git+https://git.internal.company/design-guide.git#v0.2.0"
  }
}
```

```bash
yarn install
```

- 설치 시점에 이 패키지의 `prepare` 스크립트(`yarn build`)가 실행되어
  `dist/`(번들 + 타입 선언)가 자동 생성됩니다. 별도 빌드 절차가 필요 없습니다.
- 업데이트 시 태그만 바꾸고(`#v0.2.0` → `#v0.3.0`) `yarn install`.
- 롤백은 이전 태그로 되돌리면 끝.
- **브랜치명(`#main`)을 참조하지 마세요.** 재현성이 깨지고 예기치 않은 변경이 유입됩니다.

대안이 필요한 환경:

- **Git Submodule**: `git submodule add … vendor/admin-ui && git checkout v0.2.0`
  후 `"@company/admin-ui": "file:./vendor/admin-ui"` 로 참조(커밋 SHA 고정).
- **오프라인 tarball(완전 폐쇄망)**: 릴리스 아티팩트를 반입해
  `yarn add ./artifacts/company-admin-ui-0.2.0.tgz`.

## 2) 스타일 연결 — 토큰 + Tailwind 프리셋

컴포넌트는 Tailwind 유틸리티와 디자인 토큰(`--au-*`)으로 스타일링되며, **소스가 함께
배포**됩니다. 소비 시스템의 Tailwind 가 라이브러리 소스까지 스캔해 CSS 를 생성합니다.

`tailwind.config.js`:

```js
import adminUiPreset from "@company/admin-ui/tailwind-preset";

export default {
  presets: [adminUiPreset], // 토큰 → 유틸리티 매핑(bg-surface, text-text 등)
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    // 라이브러리 컴포넌트의 클래스도 함께 컴파일(소스 배포)
    "./node_modules/@company/admin-ui/src/lib/**/*.{ts,tsx}",
  ],
};
```

앱 진입 CSS(예: `src/index.css`):

```css
@import "@company/admin-ui/styles"; /* 디자인 토큰(--au-*) */

@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 3) 사용 예시

```tsx
import { AdminShell, DataTable, Button } from "@company/admin-ui";

export function UsersPage() {
  return (
    <AdminShell title="사용자 관리">
      <DataTable
        columns={[
          { key: "name", header: "이름" },
          { key: "role", header: "권한" },
        ]}
        rows={users}
        emptyText="표시할 사용자가 없습니다."
      />
      <Button variant="primary">사용자 추가</Button>
    </AdminShell>
  );
}
```

토스트/확인 다이얼로그는 라이브러리 프로바이더로 바로 사용할 수 있습니다:

```tsx
import { ToastProvider, AlertProvider, useToast, useAlert } from "@company/admin-ui";

// 앱 루트에서 한 번 감싸고
<AlertProvider>
  <ToastProvider>{children}</ToastProvider>
</AlertProvider>;

// 어디서든 호출
const toast = useToast();
const { confirm, prompt } = useAlert();
toast.success("저장되었습니다.");
if (await confirm("정말 삭제할까요?")) { /* … */ }

const name = await prompt("새 이름을 입력하세요.", "기존 이름", { required: true });
if (name != null) { /* 확인: 입력값, 취소: null */ }
```

> 실제 export 목록은 `docs/04-ui-guidelines.md`와 소스의 `src/lib/index.ts`를 기준으로 합니다.

## 하네스 템플릿 복사 (최초 1회)

라우팅·인증·데이터 패칭 골격은 라이브러리가 아니라 **여러분 앱의 코드**입니다.
이 레포의 하네스를 시작 템플릿으로 복사한 뒤, 자유롭게 고쳐 쓰세요.
**복사한 뒤에는 upstream 과 동기화하지 않습니다** — upstream 의 하네스 변경은 예시 갱신일 뿐입니다.

| 복사 대상 | 역할 |
| --- | --- |
| `src/main.tsx`, `src/App.tsx`, `src/routes.tsx`, `src/index.css` | 앱 진입점·라우팅 |
| `src/auth.ts`, `src/providers/**` | 인증 상태 (토스트/알림 프로바이더는 라이브러리에 포함 — 복사 불필요) |
| `src/api/**` | 데이터 계층 — API 목록 한 파일(`index.ts`) + axios 클라이언트 (docs/09) |
| `src/pages/**` | 컨테이너 페이지 예시 |

복사한 하네스가 쓰는 의존성은 소비 시스템의 `package.json` 에 직접 추가합니다
(라이브러리 패키지에 딸려오지 않습니다):

```bash
yarn add axios @tanstack/react-query react-router-dom
```

복사 후 하네스 내부의 `../lib` 상대 import 는 `@company/admin-ui` 로 바꿉니다.

## 테마 적용

토큰은 CSS 변수로 노출되어 소비 시스템에서 덮어쓸 수 있습니다. `src/lib` 를 수정하지
말고 **소비 쪽 CSS 에서 오버라이드**하세요(충돌 지점이 사라집니다).

```css
:root {
  --au-color-primary: #2563eb;   /* 브랜드 색상 오버라이드 */
  --au-radius-md: 8px;
}
```

### 다크/라이트 전환 + 저장 (사용처 구현)

라이브러리는 **프레젠테이션 전용**이라 다크 토큰(`[data-theme="dark"]`)과 토글용
`Button` 만 제공합니다. **테마 상태·localStorage 저장·`data-theme` 적용은 소비 앱
(복사해 소유하는 하네스)의 책임**입니다. 아래 패턴을 앱 루트에 두세요.

```tsx
import { useEffect, useState } from "react";
import { AdminShell, Button } from "@company/admin-ui";

const THEME_KEY = "au-theme"; // FOUC 스크립트와 동일 키

function useTheme() {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "dark";
    } catch {
      return false; // 스토리지 차단 환경(아래 주의 참고)
    }
  });

  // dark 상태를 <html data-theme> 와 localStorage 에 동기화
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // 저장 불가 시 세션 내 전환은 되지만 새로고침하면 초기화됩니다.
    }
  }, [dark]);

  return { dark, toggle: () => setDark((v) => !v) };
}

// AdminShell 의 actions 슬롯에 토글 버튼을 배치
function Shell() {
  const { dark, toggle } = useTheme();
  return (
    <AdminShell
      title="사용자 관리"
      actions={
        <Button variant="secondary" size="sm" onClick={toggle}>
          {dark ? "라이트" : "다크"}
        </Button>
      }
    >
      {/* … */}
    </AdminShell>
  );
}
```

**새로고침 깜빡임(FOUC) 방지** — React 마운트 전 첫 페인트에서 이미 저장된 테마를
적용하려면, 소비 앱의 `index.html` `<head>` 에 블로킹 인라인 스크립트를 넣으세요.
(위 `useEffect` 는 마운트 후에야 실행되므로, 이게 없으면 새로고침마다 라이트로 잠깐
그려진 뒤 다크로 바뀝니다.)

```html
<!-- 키("au-theme")는 위 THEME_KEY 와 반드시 일치 -->
<script>
  (function () {
    try {
      var t = localStorage.getItem("au-theme");
      document.documentElement.setAttribute("data-theme", t === "dark" ? "dark" : "light");
    } catch (e) {}
  })();
</script>
```

> **주의 — 저장이 안 되는 것처럼 보일 때:** 앱을 `allow-same-origin` 이 없는
> `sandbox` iframe(일부 미리보기·문서 임베드) 안에서 렌더링하면 `localStorage` 접근이
> 막혀 **토글은 되지만 새로고침 시 라이트로 초기화**됩니다(코드 문제가 아님). 이때는
> 임베드하는 **호스트 측에서 iframe 에 `allow-same-origin` 을 허용**해야 합니다.
> 일반 브라우저 탭에서는 그대로 저장·복원됩니다.

## 업그레이드 체크리스트

1. [릴리스 노트/CHANGELOG](06-versioning-release.md) 확인 (특히 파괴적 변경).
2. 의존성 태그 갱신(`#v0.2.0` → `#v0.3.0`) 후 `yarn install`.
3. 타입 에러·경고 확인(`yarn typecheck`).
4. 주요 관리자 화면 스모크 테스트.
5. 문제 시 이전 태그로 즉시 롤백.
