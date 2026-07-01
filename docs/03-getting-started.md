# 03. 시작하기 (Getting Started) — 소비 시스템 연동

소비 시스템(사내 관리자 앱)에서 이 라이브러리를 사용하는 방법입니다.
격리 환경 특성상 **버전은 항상 고정 참조(태그/커밋)**로 지정합니다.

## 방식 A) 내부 Git 태그를 의존성으로 참조 (권장)

`package.json`:

```jsonc
{
  "dependencies": {
    "@company/admin-ui": "git+https://git.internal.company/design-guide.git#v1.4.0"
  }
}
```

```bash
yarn install
```

- 업데이트 시 태그만 바꾸고(`#v1.4.0` → `#v1.5.0`) `yarn install`.
- 롤백은 이전 태그로 되돌리면 끝.
- **브랜치명(`#main`)을 참조하지 마세요.** 재현성이 깨지고 예기치 않은 변경이 유입됩니다.

## 방식 B) Git Submodule

```bash
git submodule add https://git.internal.company/design-guide.git vendor/admin-ui
cd vendor/admin-ui && git checkout v1.4.0
```

- 소비 레포는 서브모듈이 가리키는 **커밋 SHA**를 고정합니다.
- 폐쇄망 빌드에 강하지만 서브모듈 업데이트 절차를 팀에 공유하세요.

## 방식 C) 오프라인 tarball (완전 폐쇄망)

```bash
# 반입 가능한 릴리스 아티팩트(tgz)를 로컬에 두고 설치
yarn add ./artifacts/company-admin-ui-1.4.0.tgz
```

## 사용 예시

```tsx
import { AdminShell, DataTable, Button } from "@company/admin-ui";
import "@company/admin-ui/tokens"; // 디자인 토큰(CSS 변수) 로드

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

> 위 컴포넌트/토큰명은 예시입니다. 실제 export 목록은 `docs/04-ui-guidelines.md`와 소스의 `src/index.ts`를 기준으로 합니다.

## 테마 적용

토큰은 CSS 변수로 노출되어 소비 시스템에서 덮어쓸 수 있습니다.

```css
:root {
  --au-color-primary: #2563eb;   /* 브랜드 색상 오버라이드 */
  --au-radius-md: 8px;
}
```

## 업그레이드 체크리스트

1. [릴리스 노트/CHANGELOG](06-versioning-release.md) 확인 (특히 파괴적 변경).
2. 태그/서브모듈 커밋 갱신.
3. `yarn install` 후 타입 에러·경고 확인.
4. 주요 관리자 화면 스모크 테스트.
5. 문제 시 이전 태그로 즉시 롤백.
