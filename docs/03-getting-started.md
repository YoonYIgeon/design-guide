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

> 실제 export 목록은 `docs/04-ui-guidelines.md`와 소스의 `src/lib/index.ts`를 기준으로 합니다.

## 하네스 템플릿 복사 (최초 1회)

라우팅·인증·데이터 패칭 골격은 라이브러리가 아니라 **여러분 앱의 코드**입니다.
이 레포의 하네스를 시작 템플릿으로 복사한 뒤, 자유롭게 고쳐 쓰세요.
**복사한 뒤에는 upstream 과 동기화하지 않습니다** — upstream 의 하네스 변경은 예시 갱신일 뿐입니다.

| 복사 대상 | 역할 |
| --- | --- |
| `src/main.tsx`, `src/App.tsx`, `src/routes.tsx`, `src/index.css` | 앱 진입점·라우팅 |
| `src/auth.ts`, `src/providers/**` | 인증 상태·토스트/알림 |
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

## 업그레이드 체크리스트

1. [릴리스 노트/CHANGELOG](06-versioning-release.md) 확인 (특히 파괴적 변경).
2. 의존성 태그 갱신(`#v0.2.0` → `#v0.3.0`) 후 `yarn install`.
3. 타입 에러·경고 확인(`yarn typecheck`).
4. 주요 관리자 화면 스모크 테스트.
5. 문제 시 이전 태그로 즉시 롤백.
