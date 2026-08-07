# Changelog

이 프로젝트의 모든 주목할 변경 사항을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/) 를, 버전은 [SemVer](https://semver.org/lang/ko/) 를 따릅니다.

## [Unreleased]
### Fixed
- `AdminShell` 사이드바가 `activeKey` 와 **정확히 일치**할 때만 활성 표시되던 문제 수정.
  이제 항목 key 의 하위 경로에서도 그 항목이 활성이 된다(예: key `/posts` 는 `/posts/12`,
  `/posts/12/edit` 에서도 활성). 상세 페이지로 들어가면 사이드바에서 현재 위치가 사라지던 증상이 없어진다.
  - **경계(`/`) 단위 비교** — `/user` 는 `/users/1` 에 걸리지 않는다(단순 `startsWith` 가 아님).
  - **루트(`/`) 예외** — 모든 경로의 상위가 되어버리므로 정확히 일치할 때만 활성이다.
  - **가장 구체적인 것 하나만 활성** — `/posts` 와 `/posts/new` 가 함께 있고 현재가 `/posts/new` 면
    더 긴 key 인 `/posts/new` 만 활성이 된다(둘 다 켜지지 않는다).
  - 후보는 이동 대상인 잎 항목뿐이다. 그룹 헤더는 이동하지 않으므로 기존대로 하위에 활성 항목이
    있을 때(`containsKey`) 강조되고, 자동 펼침도 같은 규칙을 따라 하위 경로에서 그룹이 열린다.
  - key 가 정확히 일치하던 기존 사용처는 동작 변화 없음.
- `Modal` 본문이 길면 패널이 화면 밖으로 밀려 나가 헤더·푸터(확인/취소 버튼)에 손이 닿지 않던 문제 수정.
  패널을 `flex flex-col max-h-full` 로, 본문을 `min-h-0 flex-1 overflow-auto` 로 바꿔
  **헤더·푸터는 고정되고 본문만 스크롤**되게 했다. 이전에는 `panelClassName="h-[80vh] flex flex-col"`
  처럼 소비 측이 직접 조립해야 겨우 비슷하게 만들 수 있었고, 그마저도 본문에 `overflow` 가 없어
  스크롤은 되지 않았다.
  - `min-h-0`: flex 자식의 기본 `min-height: auto` 때문에 스크롤 대신 패널이 늘어나는 것을 막는다.
  - Select·Dropdown·Tooltip 패널은 포털로 `fixed z-popover` 에 그려지므로 본문 `overflow-auto` 에
    잘리지 않는다.
  - 본문이 짧은 기존 모달은 높이·여백이 그대로다(스크롤 미발생).
- `Modal` 에 `bodyClassName` prop 추가 — 본문 기본값(`min-h-0 flex-1 overflow-auto px-4 py-4`) 뒤에
  이어 붙는 이스케이프 해치(`Card.bodyClassName` 과 같은 층위). 예: 여백 없이 꽉 채우기 `"p-0"`.

### Added
- `DataTable` 열 정렬(sortable) 추가 — `Column.sortable` 을 준 열은 헤더가 정렬 버튼이 되고,
  현재 정렬 상태는 `sort`(`{ key, direction }` 또는 `null`)로 내려주고 `onSortChange` 로 올려받는다.
  페이지네이션과 같은 controlled 계약이라 **행 재배열은 컴포넌트가 하지 않는다** — `rows` 에는
  이미 정렬된 행을 넘긴다(클라이언트면 소비 측에서 정렬, 서버면 정렬 파라미터로 fetch).
  정렬이 바뀔 때 페이지를 1로 되돌리는 것도 소비 시스템의 몫이다.
  헤더는 `<button type="button">` 이라 키보드로 토글되고 `<th aria-sort>` 로 상태를 알린다.
  인디케이터는 비활성일 때도 자리를 차지해(투명도만 변화) hover 시 열 폭이 흔들리지 않는다.
  아이콘 `IconArrowUp`·`IconArrowDown`·`IconArrowUpDown` 추가.
  `sortable` 을 주지 않은 기존 사용처는 마크업·동작 변화 없음.

  ```tsx
  const columns = [
    { key: "name", header: "이름", size: "grow", sortable: true },
    // 날짜는 "최신 먼저"가 자연스러우므로 첫 클릭 방향을 desc 로
    { key: "lastLogin", header: "최근 로그인", size: "fit", sortable: true, defaultSortDirection: "desc" },
  ];

  <DataTable
    columns={columns}
    rows={sortedRows}                       // 정렬은 소비 시스템이 끝내서 넘긴다
    rowKey={(u) => u.id}
    sort={sort}
    onSortChange={(next) => { setSort(next); setPage(1); }}
  />
  ```

  - `Column.sortKey`: 표시 열과 정렬 키가 다를 때(서버 필드명 등). 생략 시 `key`.
  - `Column.defaultSortDirection`: 그 열을 처음 눌렀을 때의 방향(기본 `"asc"`).
  - `sortClearable`: 같은 열 반복 클릭을 `기본 방향 → 반대 방향 → 해제(null)` 3단계로(기본 false).

### Changed
- **(파괴적)** `LoginForm` 의 1차 인증 입력을 `idInput`·`passwordInput` 덮어쓰기 객체로 받는다 —
  직전에 추가했던 평면 props `idLabel`·`passwordLabel` 은 제거했다(릴리스 전 교체).
  레이블뿐 아니라 `placeholder`·`autoComplete`·`hint`·`error`·`type` 등 `Input` 이 받는 것을
  거의 그대로 열어, 필드마다 props 를 새로 다는(`idAutoComplete`, `idHint`…) 일을 없앤다.
  타입은 `LoginFormInputProps`(= `Omit<InputProps, "value" | "onChange">`)로 내보낸다.
  입력값은 폼이 보유하는 UI 상태이므로 `value`/`onChange` 는 열지 않으며, JSX 에서도
  `기본값 → 덮어쓰기 → value/onChange` 순으로 놓아 무엇을 넘겨도 상태는 폼이 지킨다.
  기본값(`"아이디"`·`"사내 계정 아이디"`·`"비밀번호"` 등)은 그대로라 아무것도 안 넘기면 동작 변화 없음.

  ```tsx
  <LoginForm
    idInput={{ label: "사번", placeholder: "10자리 사번" }}
    passwordInput={{ placeholder: "••••••••" }}
    onSubmit={handleLogin}
  />
  ```

### Fixed
- `AdminShell` 의 사이드바에 모바일에서 접근할 방법이 아예 없던 문제 수정 — 사이드바는
  `md` 미만에서 `hidden` 처리만 돼 있고 여는 수단이 없어, 좁은 화면에서는 내비게이션 전체가
  사라졌다. 상단바 왼쪽에 메뉴 버튼(`md:hidden`)을 두고, 누르면 같은 내비를 서랍으로 연다.
  오버레이 클릭·ESC·항목 이동(`onNavigate`) 시 닫히고, 열 때 포커스를 서랍 안으로 옮겼다가
  닫을 때 메뉴 버튼으로 되돌린다. 서랍과 고정 사이드바는 같은 내용을 그리며(`SidebarBody`),
  `md` 이상 동작과 기존 props 는 변화 없다. 아이콘 `IconMenu` 추가.
- `Button` 의 `type` 기본값을 `"button"` 으로 지정 — HTML 기본값(`"submit"`)이 그대로 적용돼
  `<form>` 안에 놓인 `DataTable` 페이지네이션(이전/다음)을 누르면 폼이 제출되던 문제 수정.
  `Button` 으로 만든 모든 비제출 버튼(툴바 액션 등)에 동일하게 적용되며, 제출 버튼은 기존처럼
  `type="submit"` 을 명시하면 된다(저장소 안의 제출 버튼은 모두 이미 명시하고 있어 동작 변화 없음).
- `RadioGroup` 이 `readOnly` 일 때 `(필수)` 표시가 사라지던 문제 수정 — 읽기 전용 표시에도 `required` 를 전달해 항상 노출.
- `RadioGroup` 옵션 영역의 높이가 다른 입력(`h-10`)보다 낮던 문제 수정 — 최소 높이(`2.5rem`) 확보 후 세로 가운데 정렬로 맞춤.
- `AsyncInput` 이 내부 `<input>` 으로 ref 를 넘기지 않던 문제 수정 — `forwardRef` 로 감싸
  react-hook-form `Controller` 처럼 ref 를 주입하는 컨테이너와 호환되게 했다.
  제네릭 `Res` 는 `forwardRef` 로 소실되므로 캐스팅으로 시그니처를 보존한다.

### Added
- `QrCode` 컴포넌트와 QR 인코더(`src/lib/utils/qr.ts`) 추가 — 문자열을 QR 코드 SVG 로 그린다.
  격리망에서 외부 QR 생성 서비스를 부를 수 없으므로 인코딩(ISO/IEC 18004, 바이트 모드,
  버전 1~40, 오류 정정 L/M/Q/H)을 라이브러리 안에서 직접 한다. **외부 의존성은 추가하지 않았다.**
  입력은 UTF-8 로 인코딩하므로 한글이 섞인 URI 도 된다. 담을 수 없이 긴 값이면 예외 대신
  `fallback` 을 그리고 콘솔로 한 번 알린다(렌더 중 크래시 방지).
- `LoginForm` 에 `otpQrValue` 추가 — 서버가 준 `otpauth://totp/…` URI 를 그대로 넘기면 폼이 QR 을
  그린다. 오류 정정 수준은 `otpQrLevel`(기본 `"M"`). QR 자리는 `otpQrCode`(노드) →
  `otpQrImageSrc`(이미지) → `otpQrValue`(URI) → 자리표시자 순으로 우선한다.
- 토큰 `--au-color-text-fixed`(Tailwind `text-text-fixed`) 추가 — `--au-color-surface-fixed` 와 짝을
  이루는, 테마와 무관한 고정 전경색. QR 처럼 밝고 어두운 색이 뒤집히면 스캔이 안 되는 곳에 쓴다.
- `LoginForm` 이 모르는 `step` 값을 받으면 콘솔로 한 번 경고한다 — 모르는 값은 1차 인증
  화면으로 폴백되는데, 조용히 폴백되면 "`step` 을 바꿨는데 폼이 안 바뀐다"로만 보여 원인을
  찾기 어렵다. 값당 한 번만 찍고(렌더마다 쌓이지 않음), 오타·구버전 사본을 함께 안내한다.
  라이브러리에 빌드 환경 감지(`import.meta.env`)를 두지 않는 원칙에 따라 프로덕션에서도 켜 둔다.
- `LoginForm` 에 인증 앱 등록(QR) 단계 추가 — `step` 에 `"otp-enroll"` 이 생겼다. 인증 앱이 이미
  등록된 계정은 기존대로 `"otp"`(코드 입력만), 아직 등록하지 않은 계정은 `"otp-enroll"` 로 QR 코드와
  수동 등록 키를 함께 그린다. 어느 쪽인지 판단하는 것은 서버 응답을 보는 소비 시스템의 몫이다.
  시크릿 발급과 `otpauth://` URI 구성은 서버가 하고, 폼은 받은 것을 그리기만 한다
  (QR 인코딩은 라이브러리 안에서 — 위 `QrCode` 항목 참고, 외부 서비스 호출 없음).
  등록 확인 코드는 `onSubmitOtpEnroll({ code })` 로 올려보내며,
  생략하면 `onSubmitOtp` 로 간다. 표시 자리는 모두 노드 슬롯이다: `otpEnrollTitle`·
  `otpEnrollDescription`·`otpSecret`·`otpSecretLabel`·`otpQrPlaceholder`·`otpEnrollHint`·
  `otpEnrollSubmitText`, 하단은 `otpEnrollFooter ?? otpFooter ?? footer`. 등록 단계에는 재전송
  버튼을 그리지 않는다(TOTP 앱은 코드를 받는 방식이 아니다). `step` 이 바뀌면 입력한 코드는 비운다.
  기존 `"credentials"`/`"otp"` 사용처는 동작 변화 없음.
- 토큰 `--au-color-surface-fixed`(Tailwind `bg-surface-fixed`) 추가 — 다크 테마에서 재정의하지 않는
  항상 밝은 표면. QR/바코드처럼 어두운 바탕에서는 스캔이 되지 않는 영역에만 쓴다.
- 2차 인증 로그인 샘플 페이지에 등록 단계 데모 추가 — "인증 앱이 이미 등록됨" 체크를 풀면 미등록
  계정으로 로그인해 `"otp-enroll"` 단계를 볼 수 있다. QR 은 데모용 `otpauth://` URI 를 실제로
  인코딩한 것이라 인증 앱으로 스캔된다(코드 검증만 지연으로 흉내낸다).
- 데모 하네스에 2차 인증 로그인 샘플 페이지 추가(`/login-sample`, `src/pages/LoginTwoFactorPage.tsx`) —
  단계 전환·코드 검증·재전송 쿨다운을 컨테이너가 갖는 소비 시스템 쪽 예시. API 호출 자리는
  네트워크 없이 지연으로 흉내내며(격리망 준수), 실제 시스템은 `src/api` + `useMutation` 으로 바꿔 끼운다.
- `LoginForm` 에 2차 인증(OTP) 단계 props 추가 — `step?: "credentials" | "otp"`(기본 `"credentials"`)
  로 어느 단계를 그릴지 받고, 코드 제출은 `onSubmitOtp({ code })` 로 올려보낸다. "2차 인증이
  필요한가"의 판단·검증 API 호출·재전송 쿨다운은 모두 소비 시스템의 몫이다(프레젠테이션 전용 유지).
  표시 자리는 모두 노드 슬롯으로 열었다: `otpTitle`·`otpDescription`·`otpLabel`·`otpHint`·
  `otpSubmitText`·`submitText`·`resendText`·`backText`, 하단은 `otpFooter ?? footer`.
  `otpLength`(기본 6)는 입력 `maxLength` 와 기본 안내 문구에 반영되고, 코드 입력은
  `autoComplete="one-time-code"`·`inputMode="numeric"` 로 그린다. `onResendOtp`/`onBack` 은
  넘긴 경우에만 각각 재전송·이전 단계 버튼이 보이며, `resendDisabled` 로 쿨다운을 표현한다.
  단계가 `"otp"` 를 벗어나면 입력한 코드는 비운다. 기존 사용처는 `step` 생략 시 동작 변화 없음.
- `DataTable` 의 `Column` 에 `size?: "fit" | "grow"` 옵션 추가 — 열 너비 배분 방식을 정한다.
  `"fit"` 은 내용 폭에 딱 맞춰 줄어들고(줄바꿈 없음, 배지·날짜·액션 버튼 열용),
  `"grow"` 는 남는 가로 공간을 가져간다(`flex-grow: 1` 과 같은 역할, 여러 열이면 나눠 가짐).
  기존 `width` 는 그대로 동작하며 `size` 보다 우선한다. 생략 시 기존과 동일한 브라우저 기본 배분.
  데모 하네스(`DashboardPage`)의 이름 열을 `"grow"`, 권한·상태·최근 로그인·액션 열을 `"fit"` 으로 연결.
- `Modal` 에 `panelClassName` prop 추가 — 패널(카드)에 커스텀 클래스를 덧입히는 이스케이프 해치.
  기본 클래스와 `size` 뒤에 이어 붙으며(예: 높이 고정 + 본문 스크롤 `"h-[80vh] flex flex-col"`),
  같은 속성을 덮어쓸 땐 important 수정자(`!max-w-none`)를 쓴다. 생략 시 기존 동작과 동일.
- `DataTable` 에 `checkable` prop 추가 — `true` 면 맨 왼쪽에 체크박스 열(전체 선택 헤더 포함,
  부분 선택 시 indeterminate)을 렌더한다. 선택 상태는 컨트롤드로, 선택된 행의 `rowKey` 값 배열을
  `value` 로 내려주고 `onChange(selectedIds, changed)` 로 올려받는다. `changed` 는 이번에 토글된
  행들을 `{ id(uniqueId), row, checked }` 로 담아(행 클릭=1건, 전체 선택/해제=바뀐 행들) `row` 원본
  데이터를 함께 준다(현재 페이지 행 한정). `isRowSelectable?: (row) => boolean` 으로 특정 행의 선택을
  비활성화(전체 선택 대상에서도 제외)할 수 있다. 체크박스 클릭은 `onRowClick` 으로 전파되지 않는다.
  기본 `false` 로 기존 동작과 하위 호환. 데모 하네스(`DashboardPage`)에 선택 상태·선택 개수 표시를 연결.
- `DataTable` 에 `selectionMode?: "single" | "multiple"` prop 추가(기본 `"multiple"`) — `checkable` 의
  선택 컨트롤 모양을 정한다. `"multiple"` 은 체크박스+전체 선택 헤더(기존 동작), `"single"` 은 라디오로
  한 번에 한 행만 선택되고 전체 선택 헤더가 없다. 단일 모드에서 `value` 는 0~1개의 id 만 담고, 새 행을
  고르면 이전 선택이 자동 대체되며 `onChange` 의 `changed` 에는 방금 고른 행 1건(`checked: true`)만 담긴다.
- `Dropdown` 에 `onOpenChange?: (open: boolean) => void` prop 추가 — 패널이 열리거나
  닫힐 때(열림=`true`, 닫힘=`false`) 호출된다. 열림 상태는 컴포넌트가 내부에서 관리하는
  비제어 방식 그대로이며, 이 콜백은 상태 변화만 알려 준다(추적·포커스 이동 등 부수효과는 컨테이너 책임).
  최초 마운트에는 발화하지 않으며 실제 상태 전환일 때만 호출한다.
- `DataTable` 에 `fillHeight` prop 추가 — `true` 면 상위 컨테이너 높이를 꽉 채우고,
  헤더(`sticky`)와 푸터(페이지네이션)를 고정한 채 본문(`tbody`)만 세로 스크롤한다.
  기본 `false`(내용 높이만큼 차지)로 기존 동작과 하위 호환. 부모가 높이를 제한해야 동작한다.
- `AdminShell` 에 `sidebarFooter` prop 추가 — 사이드바 하단 표기(버전·환경 등)를 상위(하네스)에서 넘길 수 있게 함.
  `ReactNode` 를 받아 문자열도 그대로 동작하며, 생략 시 기존 기본 표기를 쓰고 `null` 을 주면 영역을 숨긴다.
  하네스(`src/App.tsx`)가 `"격리망 전용 · v0.1.0"` 을 직접 넘기도록 연결.
- 데모 하네스에서 `DataTable` 페이지네이션을 실제로 연결 — 페이지 크기 선택(20/50/100)을
  `pageSizeOptions`/`onPageSizeChange` 로 노출. 페이지·페이지 크기 상태와 행 슬라이싱은 컨테이너가 소유.
- `Dropdown` 추가 — 트리거 클릭 시 카드형 패널이 뜨는 프레젠테이션 전용 컴포넌트.
  `Select`와 같은 flip 로직(패널 실측 높이 기준으로 아래 공간이 부족하면 위로 뒤집기)을 쓰고,
  `Tooltip`처럼 portal(`document.body`) + fixed 좌표로 그려 조상 `overflow`에 잘리지 않음.
  트리거는 `children`(단일 요소)으로 자유롭게 구성하며, 두 모드를 지원:
  단순 액션 목록은 `items`/`onSelect`(role="menu"), 필터 폼처럼 임의 구성이 필요하면
  `content`(함수로 주면 `{ close }` 를 받아 "적용" 버튼 등에서 직접 닫을 수 있음) —
  이 경우 패널 내부 클릭으로는 자동으로 닫히지 않는다. `Icons.IconMoreVertical` 아이콘 추가.

## [0.2.0] - 2026-07-02
### Added
- `PromptDialog` 추가 — Modal + Input 위에 확인/취소를 얹은 프레젠테이션 전용 입력 다이얼로그.
  입력값은 순수 UI 상태로만 보유하고 `onSubmit(value)` 로 전달하며, 표시 자리(title/description/label/hint/error)는 `ReactNode` 로 받음.
- **유연한 합성 가이드** `docs/11-flexible-composition.md` 추가 — 표시용 자리는 `string` 대신 `ReactNode` 로 받고,
  기본 렌더가 있는 자리는 대체 슬롯을 연다는 방침. README·CLAUDE.md 설계 원칙에 반영.
- `AdminShell` 헤더 유연화: `brand` 를 `ReactNode` 로, 로고 자리 `logo` 슬롯 추가,
  `user` 를 구조화 객체(`AdminShellUser`) 또는 커스텀 노드로 받도록 확장(`avatar` 로 이니셜 아바타 대체).
- `LoginForm` `brand`·`subtitle` 을 `ReactNode` 로, 로고 자리 `logo` 슬롯 추가.
- 프로젝트 초기 가이드 문서 세트 추가 (개요/아키텍처/시작하기/UI 가이드/Git 워크플로우/버저닝/기여).
- React + TypeScript + Tailwind 기반 관리자 UI 라이브러리 및 데모 앱 추가.
  - 컴포넌트: `AdminShell`, `DataTable`, `Button`, `Input`, `Modal`, `Card`, `StatCard`, `Badge`, `EmptyState`, 인라인 `Icons`.
  - 디자인 토큰(`--au-*`) 기반 테마, 라이트/다크 지원.
  - 데모 대시보드(지표 카드 + 사용자 관리 테이블 + 추가 모달).
- 로그인 페이지 추가: 아이디/비밀번호 입력, 검증·에러 표시, 로딩 상태.
  인증 상태에 따라 로그인 ↔ 관리자 콘솔 전환 및 로그아웃 버튼 연결.
### Changed
- **프레젠테이션 전용 원칙 확립**: 라이브러리 컴포넌트는 데이터와 분리하고 그리기만 담당.
  - axios + react-query 데이터 계층(`src/api`)·목 백엔드·`.env.example` 제거.
  - `LoginForm`을 프레젠테이션 전용 컴포넌트로 추가(값은 props, 제출은 `onSubmit`).
  - `DashboardPage`를 props/callback 기반 뷰로 리팩터링(데이터·패칭 없음).
  - `src/App.tsx`는 정적 예시 데이터만 주입하는 프리뷰 하네스로 정리.
  - 원칙 문서 `docs/08-presentational-only.md` 추가, README·UI 가이드·기여 가이드에 반영.
- primary 색상을 브랜드 값 `rgb(0, 72, 77)`로 변경(다크 테마는 대비를 위한 밝은 틴트).
- 라우팅 추가(react-router-dom): 로그인 `/login`, 대시보드 `/`, `/users`·`/audit`·`/settings`.
  - 미인증 시 보호 경로 접근/딥링크를 `/login` 으로 리다이렉트, 로그인/로그아웃 시 경로 전환.
  - 라우팅은 프리뷰 하네스(`src/App.tsx`)에만 두고, `AdminShell` 은 `activeKey`/`onNavigate`
    props 로만 라우터와 연결(프레젠테이션 전용 원칙 유지).
- 로그인 자동 로그인 + 쿠키 세션 추가.
  - `LoginForm` 에 "자동 로그인" 체크박스 추가(값은 `onSubmit` 의 `remember` 로 전달, 로직 없음).
  - 하네스 `src/auth.ts`: `token`/`refreshToken` 쿠키 저장·복원. 앱 로드 시 쿠키가 있으면 자동 로그인,
    로그아웃 시 쿠키 제거. `remember` 로 지속(30일)/세션 쿠키 결정.
- 패키지 매니저를 **yarn 전용**으로 전환: `packageManager` 지정, `package-lock.json` 제거·gitignore,
  문서 명령을 yarn 으로 변경, 규칙을 `CLAUDE.md` 에 명문화.
- **UI 상태 프로바이더를 라이브러리로 승격**: `ToastProvider`(`useToast`)·`AlertProvider`(`useAlert`)를
  하네스(`src/providers`)에서 라이브러리(`src/lib/providers`)로 이동해 패키지에서 바로 사용 가능.
  토스트 큐·다이얼로그 열림 상태는 순수 UI 상태로 보고 프레젠테이션 전용 원칙의
  명시적 예외로 docs/08 에 명문화(HTTP·영속화·라우팅 금지는 유지). 하네스에는 `AuthProvider` 만 남음.
- **패키지 소비 체계 구축(포크 대신 의존성 설치)**: 소비 시스템이 내부 Git 태그로
  `yarn add` 해 사용하는 흐름을 실제로 동작하게 정비.
  - vite 라이브러리 빌드 추가: `yarn build` 가 `src/lib/index.ts` → `dist/index.{mjs,cjs}` 번들
    (+ `tsconfig.build.json` 으로 타입 선언 생성). 데모 앱 빌드는 `yarn build:demo`(dist-demo)로 분리.
  - `prepare` 스크립트 추가 — git 의존성 설치 시점에 dist 자동 빌드(dist 는 gitignore, 커밋 안 함).
  - Tailwind 테마(토큰 매핑)를 `tailwind.preset.js` 로 분리하고
    `@company/admin-ui/tailwind-preset` 으로 export. `./styles`(=`./tokens`)는 `src/lib/tokens.css` 를 가리킴.
  - 패키지 경계 정리: `files` 를 `dist`/`src/lib`/`tailwind.preset.js` 로 축소(하네스는 미포함),
    하네스 전용 의존성(axios·react-query·react-router-dom)을 devDependencies 로 이동
    (라이브러리 runtime 의존성은 react-markdown 만 유지).
  - 문서 갱신: 시작하기(03)를 "패키지 설치 + 하네스 템플릿 최초 1회 복사" 흐름으로 재작성,
    아키텍처(02)·릴리스(06)·기여(07)의 dist 정책을 "커밋 안 함 + 설치 시 빌드"로 확정.
- **API 관리를 한 파일로 단순화**: 리소스별 `*.api.ts`/`*.queries.ts` 4개 파일을
  `src/api/index.ts`(타입 + 엔드포인트 함수 + 쿼리 키) 하나로 통합, 데모 스캐폴드는
  `src/api/demo.ts` 로 분리. 커스텀 훅 계층을 제거하고 컨테이너(pages/providers)가
  `useQuery`/`useMutation` 을 직접 호출하도록 변경(쿼리 키는 `*Keys` 헬퍼로만 생성).
  `docs/09-data-fetching.md` 를 새 컨벤션으로 갱신.
