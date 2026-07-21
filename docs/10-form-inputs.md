# 10. 폼 입력 컴포넌트 (Select · Checkbox · Radio · FileUpload)

> 관리자 화면은 입력이 많다. 이 문서는 라이브러리가 제공하는 **입력 컴포넌트 세트**의
> API·상태·접근성 규칙과, **파일 업로드를 API 와 동적으로 연동**하는 방법을 정리한다.

모든 입력 컴포넌트는 [08. 프레젠테이션 전용 원칙](08-presentational-only.md)을 따른다.
**값은 props, 변경은 callback** 으로만 주고받으며, 컴포넌트는 네트워크/상태/검증 로직을 갖지 않는다.
검증·저장·업로드 같은 로직은 컨테이너(`src/pages/**`)의 몫이다.

- 동작 데모: `/forms` 경로 (`src/pages/FormsPage.tsx`)
- 텍스트 한 줄 입력은 기존 [`Input`](../src/lib/components/Input.tsx) 을 그대로 쓴다.

공통 규칙(모든 입력 컴포넌트):

- `label` · `hint` · `error` 를 받아 `label`/`aria-describedby`/`aria-invalid` 로 접근성 연결한다.
- `error` 가 있으면 `hint` 대신 에러 문구를 빨간색으로 노출한다(둘 다 있으면 error 우선).
- `required` 는 레이블에 `*` 를 붙인다.
- 색상만으로 상태를 전달하지 않는다(아이콘/텍스트 병행 — WCAG AA).

---

## Select

**커스텀 드롭다운**(ARIA select-only combobox). 네이티브 `<select>` 대신 디자인 토큰으로
트리거·목록을 직접 그려 브라우저 간 외형을 통일한다. 키보드(↑/↓·Home/End·Enter/Space·Esc·
타이핑 검색), 포커스 복귀, 바깥 클릭 닫기를 직접 처리한다.

- **기본값은 placeholder**: `value=""` 이면 첫 옵션이 자동 선택되지 않고 placeholder 가
  muted 로 노출된다(네이티브 `<select>` 가 첫 옵션을 보이던 동작과 다름).
- `onChange` 는 이벤트가 아니라 **선택된 값(string)** 을 바로 넘긴다(RadioGroup 과 동일).
- `name` 을 주면 네이티브 폼 제출용 hidden input 을 함께 렌더한다.
- `multiple` 을 주면 **다중 선택 모드**가 된다 — `value`/`onChange` 계약이 `string[]` 로 바뀌고,
  옵션을 토글해도 목록이 닫히지 않는다(연속 선택). 미선택은 빈 배열 `[]`.

```tsx
import { Select, type SelectOption } from "@company/admin-ui";

const ROLE_OPTIONS: SelectOption[] = [
  { label: "관리자", value: "admin" },
  { label: "운영자", value: "operator" },
  { label: "정지된 계정", value: "suspended", disabled: true },
];

<Select
  label="권한 등급"
  required
  placeholder="권한을 선택하세요"
  options={ROLE_OPTIONS}
  value={role}
  onChange={setRole}
/>;
```

다중 선택은 `multiple` 을 주고 `value`/`onChange` 를 배열 계약으로 쓴다:

```tsx
const [scopes, setScopes] = useState<string[]>([]);

<Select
  multiple
  label="접근 가능 메뉴"
  placeholder="메뉴를 선택하세요"
  options={SCOPE_OPTIONS}
  value={scopes}       // string[]
  onChange={setScopes} // (values: string[]) => void
/>;
```

| prop | 타입 | 설명 |
| --- | --- | --- |
| `options` | `SelectOption[]` | `{ label, value, disabled? }` 목록 |
| `placeholder` | `string` | 미선택(`value=""` / `[]`) 시 노출할 안내 문구(muted) |
| `multiple` | `boolean` | 다중 선택 모드(기본 false). 켜면 아래 `value`/`onChange` 가 배열 계약이 된다 |
| `value` / `onChange` | `string` / `(value: string) => void` | 제어값·변경(값만 전달). `multiple` 이면 `string[]` / `(values: string[]) => void` |
| `name` | `string` | 네이티브 폼 제출용 hidden input 이름(선택). `multiple` 이면 같은 name 으로 값마다 하나씩 렌더 |
| `label` `hint` `error` `required` `disabled` | — | 공통 규칙 |

> `onChange` 는 이벤트가 아니라 **선택된 값(string)** 을 바로 넘긴다(Checkbox 와 다름, RadioGroup 과 같음).
>
> 다중 선택 UI 는 상황에 맞게 고른다 — 선택지가 적고 항상 펼쳐 보여야 하면 **Checkbox 목록**,
> 선택지가 많거나 화면을 아끼려면 **`Select multiple`**. 다중 모드의 트리거에는 선택된 라벨이
> 쉼표로 이어 노출되고, 옵션을 토글해도 목록은 닫히지 않는다(Esc/바깥 클릭으로 닫기).

---

## Checkbox

단일 체크박스. 여러 개는 이 컴포넌트를 나열하고 상태 배열을 컨테이너가 관리한다.
전체 선택 헤더용 **indeterminate(부분 선택)** 를 지원한다.

```tsx
import { Checkbox } from "@company/admin-ui";

<Checkbox
  label="전체 선택"
  checked={allChecked}
  indeterminate={someChecked && !allChecked}
  onChange={(e) => toggleAll(e.target.checked)}
/>

<Checkbox
  label="삭제"
  hint="되돌릴 수 없는 작업 권한입니다."
  checked={perms.delete}
  onChange={(e) => setPerms((p) => ({ ...p, delete: e.target.checked }))}
/>
```

| prop | 타입 | 설명 |
| --- | --- | --- |
| `label` | `ReactNode` | 체크박스 오른쪽 라벨(클릭 영역 포함) |
| `checked` / `onChange` | `boolean` / `(e) => void` | 제어값·변경 |
| `indeterminate` | `boolean` | 부분 선택 표시(DOM 프로퍼티라 내부에서 ref 로 설정) |
| `label` `hint` `error` `disabled` | — | 공통 규칙 |
| 그 외 | `InputHTMLAttributes` | `name`, `value` 등 그대로 전달 |

> `indeterminate` 는 `checked` 와 독립적인 **시각 표시**다. 전체 선택 로직(모두 선택/해제)은
> 컨테이너가 `onChange` 에서 처리한다.

---

## RadioGroup

라디오는 본질적으로 "그룹 안에서 하나 선택"이므로 개별 라디오가 아니라 **그룹 단위**로 제공한다.
`fieldset`/`legend` 로 그룹을 접근성 있게 묶는다.

```tsx
import { RadioGroup, type RadioOption } from "@company/admin-ui";

const NOTIFY_OPTIONS: RadioOption[] = [
  { label: "모든 알림", value: "all", hint: "로그인·변경·경보를 모두 받습니다." },
  { label: "중요 알림만", value: "important" },
  { label: "받지 않음", value: "none" },
];

<RadioGroup
  label="알림 수신"
  name="notify"
  value={notify}
  onChange={setNotify}
  options={NOTIFY_OPTIONS}
/>;
```

| prop | 타입 | 설명 |
| --- | --- | --- |
| `name` | `string` | 같은 그룹 식별(단일 선택 보장 — 필수) |
| `options` | `RadioOption[]` | `{ label, value, hint?, disabled? }` 목록 |
| `value` / `onChange` | `string` / `(value: string) => void` | 제어값·변경(값만 전달) |
| `orientation` | `"vertical" \| "horizontal"` | 배치 방향(기본 세로) |
| `label` `hint` `error` `required` `disabled` | — | 공통 규칙(그룹 전체) |

> `onChange` 는 이벤트가 아니라 **선택된 값(string)** 을 바로 넘긴다(Select/Checkbox 와 다름).

---

## FileUpload (API 동적 연동)

드래그&드롭 + 찾아보기 UI. **컴포넌트는 네트워크를 모른다.** 선택된 파일을 `onSelect` 로 넘기면,
컨테이너가 API 로 업로드하고 서버가 돌려준 **`{ url, name }` 객체**를 `items` 에 반영한다.
업로드 중/성공/실패 상태는 `FileItem.status` 로 그린다.

### 데이터 흐름

```
사용자가 파일 선택/드롭
        │  onSelect(File[])
        ▼
컨테이너(pages)  ── uploadFile(file, { onProgress, signal }) ──▶  src/api (axios, multipart)
        │                                                              │
        │   진행률 → FileItem.progress                                 ▼
        │   완료   → FileItem { status:"done", url, name }   ◀──  { url, name, size }
        ▼
FileUpload items 로 다시 렌더(진행 막대 → 완료 링크)
```

### 컴포넌트 API

| prop | 타입 | 설명 |
| --- | --- | --- |
| `items` | `FileItem[]` | 현재 파일 목록(제어값) |
| `onSelect` | `(files: File[]) => void` | 선택/드롭된 원본 File 목록 |
| `onRemove` | `(id: string) => void` | 개별 항목 제거/취소 |
| `accept` | `string` | 허용 형식(예: `"image/*,.pdf"`) |
| `multiple` | `boolean` | 다중 선택(기본 true) |
| `label` `hint` `error` `required` `disabled` | — | 공통 규칙 |
| `dropLabel` | `ReactNode` | 드롭존 안내 문구 |

`FileItem` (컨테이너가 채우는 값):

```ts
interface FileItem {
  id: string;               // 컨테이너가 발급(리스트 키/취소 식별)
  name: string;
  status: "uploading" | "done" | "error";
  url?: string;             // done: 서버가 돌려준 접근 URL
  size?: number;            // 바이트
  progress?: number;        // uploading: 0~100 (없으면 불확정 막대)
  error?: string;           // error: 표시 메시지
}
```

### API 계층 (`src/api/index.ts`)

업로드 엔드포인트는 다른 리소스와 동일하게 API 목록 한 파일에서 관리한다.
서버는 업로드 결과를 **`{ url, name, size }`** 로 돌려주며, 응답 필드명이 다르면 이 함수 한 곳만 고친다.

```ts
export interface UploadResult { url: string; name: string; size: number; }

export async function uploadFile(file: File, opts: UploadOptions = {}): Promise<UploadResult> {
  if (demo.DEMO_MODE) return demo.uploadFile(file, opts);
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.post<UploadResult>("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
    signal: opts.signal,
    onUploadProgress: (e) => {
      if (opts.onProgress && e.total) opts.onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}
```

### 컨테이너 연동 (`src/pages/FormsPage.tsx` 발췌)

`onSelect` 로 받은 File 마다 항목을 `uploading` 으로 추가하고, 업로드가 끝나면 `{ url, name }` 을 채운다.
`AbortController` 로 진행 중 업로드를 취소한다.

```tsx
function handleSelect(picked: File[]) {
  for (const file of picked) {
    const id = `f${(idRef.current += 1)}`;
    const controller = new AbortController();
    controllers.current[id] = controller;

    setFiles((prev) => [
      ...prev,
      { id, name: file.name, size: file.size, status: "uploading", progress: 0 },
    ]);

    uploadFile(file, {
      signal: controller.signal,
      onProgress: (percent) => patchFile(id, { progress: percent }),
    })
      .then((res) => patchFile(id, { status: "done", url: res.url, name: res.name }))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        patchFile(id, { status: "error", error: err?.message });
      });
  }
}
```

저장 시 서버로 보낼 첨부는 **완료 항목만** `{ url, name }` 배열로 정규화한다.

```tsx
const attachments = files
  .filter((f) => f.status === "done")
  .map((f) => ({ url: f.url, name: f.name }));
```

### 데모 모드

`VITE_API_BASE_URL` 이 없으면 `src/api/demo.ts` 의 `uploadFile` 이 진행률을 몇 단계로 흘려보낸 뒤
브라우저 로컬 `objectURL` 을 접근 URL 로 돌려준다(외부 호출 없음 = 격리망 준수).
환경변수를 주입하면 동일 코드가 `apiClient` 경로로 실제 `POST /uploads` 한다.

> 완료 항목의 `objectURL` 은 제거/언마운트 시 `URL.revokeObjectURL` 로 해제한다(메모리 누수 방지).
> 실제 서버 URL 은 해제할 필요가 없다(컨테이너가 `blob:` 접두사로 구분).

---

## AddableInputForm (추가/삭제 가능한 입력 행)

동적으로 **행을 추가·삭제**하는 폼(담당자 목록, 태그, 옵션 등)을 위한 **프레젠테이션 전용
컨테이너**다. 자신은 상태를 갖지 않고, 렌더할 행 배열(`items`)·각 행의 내용(`children`)·
추가/삭제 의도(`onAdd`/`onRemove`)만 주고받는다. **폼 상태·검증·필드 배열 로직은 컨테이너의
몫**이며, [react-hook-form](https://react-hook-form.com) 의 `useForm` + `useFieldArray` 와
자연스럽게 맞물린다.

### 컴포넌트 API

| prop | 타입 | 설명 |
| --- | --- | --- |
| `items` | `readonly Item[]` | 렌더할 행 배열. 이 배열의 길이가 곧 화면의 행 수(예: `useFieldArray` 의 `fields`). |
| `children` | `(item, index) => ReactNode` | 각 행의 입력 내용을 그리는 렌더 함수. |
| `onAdd` | `() => void` | 행 추가 의도(실제 추가는 컨테이너: `append(...)`). |
| `onRemove` | `(index) => void` | 행 삭제 의도(실제 삭제는 컨테이너: `remove(index)`). |
| `getKey` | `(item, index) => string \| number` | 행의 안정적 key. 재정렬/삭제가 있으면 고유 key(예: field.`id`) 권장. |
| `label`·`help`·`hint`·`error` | `ReactNode` | 레이블/보조 슬롯/힌트/에러(공통 규칙과 동일). |
| `min` · `max` | `number` | 표시 전용 가드 — `min` 이하면 삭제 버튼, `max` 이상이면 추가 버튼을 비활성화. |
| `addLabel` | `ReactNode` | 추가 버튼 라벨(기본 `"추가"`). |
| `className` | `string` | 행 컨테이너에 얹을 추가 클래스. 기본 세로 스택(`flex flex-col gap-2`)을 `flex-row` 등으로 확장(가로 배치)할 때 사용. `flex-row` 를 주면 기본 `flex-col` 은 자동 제외. |
| `emptyText` | `ReactNode` | 행이 0개일 때 안내(없으면 빈 상태를 그리지 않음). |
| `required`·`disabled` | `boolean` | 필수 표시 · 전체 비활성. |
| `readOnly` | `boolean` | 읽기 전용(값 표시만). `disabled` 와 마찬가지로 추가/삭제 버튼을 **숨긴다**(비활성이 아니라 렌더 자체를 하지 않음). |

> `min`/`max` 는 **버튼 비활성이라는 표시**만 담당한다. "몇 개까지 허용" 같은 도메인 규칙의
> 최종 판정·검증은 컨테이너(react-hook-form rules 등)에서 한다.

### 컨테이너 연동 (`src/pages/FormsPage.tsx` 발췌)

```tsx
const { register, control, handleSubmit, formState: { errors } } =
  useForm<ContactsForm>({ defaultValues: { contacts: [{ name: "", email: "" }] } });
const { fields, append, remove } = useFieldArray({ control, name: "contacts" });

<AddableInputForm
  label="담당자"
  required
  items={fields}
  getKey={(field) => field.id}
  onAdd={() => append({ name: "", email: "" })}
  onRemove={remove}
  min={1}
  max={5}
  addLabel="담당자 추가"
>
  {(_field, index) => (
    <div className="flex gap-2">
      <Input
        placeholder="이름"
        error={errors.contacts?.[index]?.name?.message}
        {...register(`contacts.${index}.name`, { required: "이름을 입력하세요." })}
      />
      <Input
        placeholder="name@company.com"
        error={errors.contacts?.[index]?.email?.message}
        {...register(`contacts.${index}.email`, {
          required: "이메일을 입력하세요.",
          pattern: { value: EMAIL_RE, message: "이메일 형식이 아닙니다." },
        })}
      />
    </div>
  )}
</AddableInputForm>
```

- `items={fields}` + `getKey={(f) => f.id}` 로 react-hook-form 이 관리하는 안정적 key 를 그대로 쓴다.
- 행 내부의 `Input` 은 `{...register(...)}` 로 이름/ref/변경을 연결하고, 에러는 `errors...message`
  를 `Input` 의 `error` 슬롯에 넣는다(공통 규칙 재사용).
- react-hook-form 은 **컨테이너(하네스)의 의존성**이다. 라이브러리(`src/lib`)는 이 훅을 모르며,
  `AddableInputForm` 은 어떤 폼 라이브러리와도(또는 순수 `useState` 배열과도) 동작한다.

---

## AsyncInput (디바운스 비동기 검사 입력)

입력이 멈추면 **디바운스** 후 비동기 검사를 수행하고(아이디 중복 확인, 쿠폰 유효성 등),
**로딩 스피너·성공/에러**를 표시하는 입력이다. 아이디 중복 확인처럼 "치는 동안 서버에
물어보는" 패턴에 쓴다.

**프레젠테이션 전용 경계**([08](08-presentational-only.md)): 컴포넌트는 **디바운스와 상태
표시(순수 UI)만** 담당한다. 실제 HTTP/조회(`resolve`)와 "응답 → 에러/성공" 해석
(`getError`/`getSuccess`/`getRequestError`)은 **전부 주입된 콜백**이며, 컴포넌트 내부에는
`fetch`/`axios`·도메인 규칙이 없다.

### 컴포넌트 API

| prop | 타입 | 설명 |
| --- | --- | --- |
| `value` · `onChange` | `string` · `(v) => void` | 제어값/변경(즉시). `Input` 과 동일. |
| `resolve` | `(value, signal) => Promise<Res>` | 디바운스 후 호출되는 **비동기 리졸버**. 실제 HTTP 는 이 콜백 안(컨테이너)에서. `signal` 로 이전 요청 취소. |
| `getError` | `(res) => ReactNode \| null` | **응답을 에러로 해석**(커스텀). 값 반환 시 에러, `null` 이면 성공. (200 이지만 실패 의미일 때) |
| `getSuccess` | `(res) => ReactNode \| null` | 성공 시 표시할 메시지(선택). |
| `getRequestError` | `(error) => ReactNode` | `resolve` 가 throw(네트워크/예외)했을 때 메시지로 변환. |
| `debounceMs` | `number` | 디바운스 지연(기본 400). |
| `skipEmpty` · `minLength` | `boolean` · `number` | 빈 값/최소 길이 미만이면 검사 건너뜀(기본 `true` / `0`). |
| `error` | `ReactNode` | 컨테이너의 **로컬(클라이언트) 검증**(예: zod) 결과. 값이 있으면 내부 비동기 에러보다 우선 표시하며, **`resolve`(API 호출)를 건너뛴다** — 로컬 검증이 성공했을 때만 네트워크 검사가 돈다. |
| `onResolved` · `onStatusChange` | `(res) => void` · `(status) => void` | 성공 응답/상태 변화 통지(선택). |
| 그 외 | — | `label`·`hint`·`placeholder`·`required` 등은 `Input` 으로 그대로 전달. |

> 상태 표시는 색만으로 전달하지 않는다 — 오른쪽 끝 **아이콘**(스피너/체크/경고, `Input.trailing`)과
> **문구**(성공=hint, 에러=error)를 함께 노출한다.

### 컨테이너 연동 (`src/pages/FormsPage.tsx` 발췌)

```tsx
// 실제 HTTP 는 컨테이너의 몫 — 여기서 axios/react-query 로 GET /users/check?id= 호출.
function checkUserIdAvailable(id: string, signal: AbortSignal): Promise<{ available: boolean }> {
  return apiClient.get(`/users/check`, { params: { id }, signal }).then((r) => r.data);
}

const [userId, setUserId] = useState("");

<AsyncInput
  label="아이디"
  value={userId}
  onChange={setUserId}
  debounceMs={500}
  minLength={4}
  resolve={checkUserIdAvailable}
  getError={(res) => (res.available ? null : "이미 사용 중인 아이디입니다.")}
  getSuccess={(res) => (res.available ? "사용 가능한 아이디입니다." : null)}
  getRequestError={() => "중복 확인에 실패했습니다. 잠시 후 다시 시도하세요."}
/>
```

- **디바운스·취소·상태**는 컴포넌트가, **조회·에러 해석**은 콜백(컨테이너)이 담당한다.
- 값이 바뀌면 이전 요청은 `signal` 로 abort 되고, 늦게 도착한 stale 응답은 무시된다.
- 정상 200 응답이라도 `getError` 로 "실패 의미"를 에러로 승격할 수 있다(커스텀 에러 처리).
- `disabled`/`readOnly` 인 동안이나, 사용자가 아직 값을 바꾸지 않은 동안(dirty 되기 전 — 예: prefill 된
  값을 그대로 마운트한 직후)에는 비동기 검사를 시작하지 않는다. 손대기 전 값에 대해 에러가 뜨는 것을 막는다.
- **로컬 검증이 성공했을 때만 API 를 호출한다** — `error`(zod 등 클라이언트 검증 결과)가 있으면 `resolve` 를
  건너뛴다. 형식이 틀린 값(예: 이메일 형식 오류)으로 불필요한 네트워크 요청이 나가지 않게 한다.
- **제출 차단은 컨테이너 몫이다** — `AsyncInput` 은 프레젠테이션 전용이라 스스로 폼 제출을 막지 않는다.
  백엔드 검사(`resolve`)가 통과했을 때만 제출을 허용하려면, `onStatusChange` 로 상태를 끌어올려
  `status === "success"` 일 때만 제출 버튼을 활성화한다(아래 발췌).

```tsx
const [status, setStatus] = useState<AsyncInputStatus>("idle");

<AsyncInput /* … */ onStatusChange={setStatus} />
<Button disabled={status !== "success"} onClick={submit}>가입</Button>
```

### react-hook-form 통합

RHF 로 폼을 관리한다면 `useState` 게이팅 대신 검증 파이프라인에 통합해 `handleSubmit`/`isValid`
가 백엔드 검사 결과까지 반영하게 한다. **두 갈래로 나누는 게 핵심**이다:

- **로컬 검증**(required/minLength/format)은 `Controller` 의 `rules` → `error` prop 으로 표시.
  `error` 가 있으면 `resolve` 가 건너뛰어지므로(위 항목) 로컬 룰 통과 후에만 네트워크 검사가 돈다.
- **백엔드 검사 성공 여부**는 `validate` 룰이 `onStatusChange` 로 끌어올린 상태(ref)를 읽어 판정한다.
  이 async 게이트 에러는 **`error` prop 으로 되먹이지 않는다** — 되먹이면 `resolve` 가 영영 안 돌아
  교착된다. 그래서 `error` 에는 `type !== "validate"` 인 로컬 에러만 넘긴다.

```tsx
const statusRef = useRef<AsyncInputStatus>("idle");
const { control, handleSubmit, trigger, formState: { errors, isValid } } =
  useForm<{ userId: string }>({ defaultValues: { userId: "" }, mode: "onChange" });

<form onSubmit={handleSubmit(submit)}>
  <Controller
    name="userId"
    control={control}
    rules={{
      required: "아이디를 입력하세요.",
      minLength: { value: 4, message: "4자 이상" },
      validate: () => statusRef.current === "success" || "중복 확인이 필요합니다.",
    }}
    render={({ field }) => (
      <AsyncInput
        value={field.value}
        onChange={field.onChange}
        resolve={checkUserIdAvailable}
        // 로컬 에러만 전달(= resolve 게이팅). async 게이트(validate)는 제외해 교착 방지.
        error={errors.userId && errors.userId.type !== "validate" ? errors.userId.message : undefined}
        // 상태를 ref 로 올리고 RHF 를 재검증 → validate 룰이 다시 돈다.
        onStatusChange={(s) => { statusRef.current = s; void trigger("userId"); }}
        /* getError·getSuccess·getRequestError … */
      />
    )}
  />
  <Button type="submit" disabled={!isValid}>가입</Button>
</form>
```

---

## 리뷰 기준

- [ ] 입력 컴포넌트는 값=props, 변경=callback 만 쓴다(네트워크/검증 로직 없음).
- [ ] `AddableInputForm` 은 상태를 갖지 않고 `items`/`onAdd`/`onRemove` 로만 동작한다(폼 훅 비의존).
- [ ] `AsyncInput` 은 내부에서 HTTP 를 하지 않는다 — 조회(`resolve`)·에러 해석(`getError` 등)은 주입 콜백이다.
- [ ] `label`/`aria-describedby`/`aria-invalid` 로 접근성이 연결된다.
- [ ] 색상만으로 상태를 전달하지 않는다(아이콘/텍스트 병행).
- [ ] 파일 업로드의 HTTP 는 `src/api` 의 `uploadFile` 로만 수행한다(컴포넌트에서 axios 금지).
- [ ] 업로드 결과는 `{ url, name }` 객체로 정규화해 저장 페이로드에 넣는다.
- [ ] `objectURL` 은 제거/언마운트 시 해제한다.
