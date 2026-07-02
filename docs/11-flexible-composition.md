# 11. 유연한 합성 (Flexible Composition)

> **표시 자리(슬롯)는 문자열이 아니라 노드로 받는다.**
> 컴포넌트는 "무엇을 그릴지"를 문자열로 못 박지 말고, 소비 시스템이 원하는 컴포넌트를
> 끼워 넣을 수 있게 열어 둔다.

프레젠테이션 전용 원칙([08](08-presentational-only.md))이 "값은 props, 상호작용은
callback"이라면, 이 문서는 **그 값을 얼마나 유연하게 받을지**에 대한 지침입니다.
동일한 컴포넌트를 여러 사내 시스템이 재사용하려면, 텍스트만 넣는 자리라도
로고·배지·링크·아바타 같은 커스텀 요소를 넣을 여지가 있어야 합니다.

## 원칙

- **표시용 슬롯은 `string` 이 아니라 `ReactNode` 로 받는다.**
  제목·이름·라벨·부제처럼 "그려질 내용"은 문자열로 좁히지 않는다. `string` 은
  `ReactNode` 의 부분집합이므로 기존 문자열 사용처는 그대로 동작한다(하위 호환).
- **기본값은 제공하되, 대체(override) 슬롯을 연다.**
  아이콘·아바타처럼 기본 렌더가 있는 자리는 `logo`, `avatar` 같은 선택적 슬롯을
  두어 소비 시스템이 필요할 때만 대체할 수 있게 한다(`node ?? 기본`).
- **흔한 경우는 구조화 객체로, 특수한 경우는 노드로.**
  자주 쓰는 형태(예: 이름+역할+아바타)는 구조화 객체로 받아 일관된 레이아웃을
  보장하고, 완전 커스텀이 필요하면 노드를 그대로 받아 그린다
  (`구조화객체 | ReactNode` 유니온 + 타입 가드).

## 예시 — 헤더(AdminShell) 사용자 영역

### ❌ 이전 — 문자열로만 받는다

```tsx
interface AdminShellProps {
  brand?: string;
  user?: { name: string; role?: string };
}
// 아바타는 name.slice(0, 1) 로 고정. 로고/이미지/배지를 넣을 수 없다.
```

### ✅ 이후 — 노드로 받고, 대체 슬롯을 연다

```tsx
interface AdminShellUser {
  name: ReactNode;          // 문자열도, 배지가 붙은 노드도 가능
  role?: ReactNode;
  avatar?: ReactNode;       // 기본 이니셜 원형 대신 이미지/아이콘
}

interface AdminShellProps {
  brand?: ReactNode;        // 문자열 또는 로고 노드
  logo?: ReactNode;         // 기본 실드 아이콘 대체
  user?: AdminShellUser | ReactNode; // 구조화 객체 또는 완전 커스텀 노드
}
```

```tsx
// 흔한 경우 — 구조화 객체 (기존과 동일하게 문자열도 OK)
<AdminShell user={{ name: "관리자", role: "시스템 관리자" }} /* ... */ />

// 아바타만 커스텀
<AdminShell
  user={{ name: "관리자", role: "시스템 관리자", avatar: <img src={url} alt="" /> }}
  /* ... */
/>

// 사용자 영역 전체를 커스텀 노드로
<AdminShell user={<UserMenu account={me} />} /* ... */ />

// 로고 + 제품명 노드
<AdminShell brand="사내 관리자" logo={<CompanyLogo />} /* ... */ />
```

## 구현 메모

- 유니온(`구조화객체 | ReactNode`)은 타입 가드로 갈래를 나눈다.
  React 요소/배열이 아닌 객체이면서 식별 키(`name`)를 가질 때만 구조화 객체로 본다.

  ```tsx
  function isUserDescriptor(u: AdminShellUser | ReactNode): u is AdminShellUser {
    return typeof u === "object" && u !== null && !isValidElement(u) && "name" in u;
  }
  ```

- 이니셜처럼 문자열을 전제하는 파생값은 `typeof x === "string"` 을 확인하고,
  아니면 중립 기본값으로 폴백한다(노드가 들어와도 깨지지 않게).

## 이 원칙이 적용된 곳

| 컴포넌트 | 유연화된 슬롯 |
| --- | --- |
| `AdminShell` | `brand`(node), `logo`, `user`(구조화 객체 \| node), `user.avatar` |
| `LoginForm` | `brand`(node), `subtitle`(node), `logo` |
| `PromptDialog` | `title`·`description`·`label`·`hint`·`error`(node) |

새 컴포넌트를 추가하거나 기존 컴포넌트를 다듬을 때, "이 자리는 문자열이면
충분한가, 아니면 노드로 열어야 하는가"를 먼저 판단하세요. 표시용 자리라면
기본값은 문자열로 두더라도 **타입은 `ReactNode` 로** 여는 것을 기본으로 합니다.

## 리뷰 기준

- [ ] 표시용(자식으로 그려질) 자리의 타입이 불필요하게 `string` 으로 좁혀져 있지 않다.
- [ ] 기본 렌더가 있는 아이콘/아바타 자리에 대체 슬롯(`node ?? 기본`)이 있다.
- [ ] 문자열을 전제한 파생값(`slice` 등)이 노드 입력에서 안전하게 폴백된다.
- [ ] 유니온 props 는 타입 가드로 갈래가 명확히 나뉜다.
