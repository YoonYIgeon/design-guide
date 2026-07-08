import { useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
  AddableInputForm,
  AsyncInput,
  Button,
  Card,
  Checkbox,
  FileUpload,
  Icons,
  Input,
  RadioGroup,
  Select,
  StepSelector,
  Tooltip,
  useToast,
  type FileItem,
  type SelectOption,
  type RadioOption,
} from "../lib";
import { uploadFile } from "../api";

/**
 * 관리자 입력 컴포넌트 카탈로그 & 파일 업로드 동적 연동 데모.
 *
 * 역할 분담(docs/08-presentational-only.md, docs/09-data-fetching.md):
 * - 입력 컴포넌트(Select/Checkbox/RadioGroup/FileUpload)는 그리기만 한다(값=props, 변경=callback).
 * - 파일 업로드의 실제 HTTP 는 이 컨테이너가 src/api 의 uploadFile 로 수행하고,
 *   서버가 돌려준 { url, name } 을 FileItem 에 반영한다(= "업로드 후 객체로 떨궈주는" 흐름).
 *
 * 소비 시스템은 이 파일을 포크해 자신의 폼/리소스에 맞게 고쳐 씁니다.
 */

const ROLE_OPTIONS: SelectOption[] = [
  { label: "관리자", value: "admin" },
  { label: "운영자", value: "operator" },
  { label: "뷰어", value: "viewer" },
  { label: "정지된 계정", value: "suspended", disabled: true },
];

const NOTIFY_OPTIONS: RadioOption[] = [
  { label: "모든 알림", value: "all", hint: "로그인·변경·경보를 모두 받습니다." },
  { label: "중요 알림만", value: "important", hint: "보안·장애 관련만 받습니다." },
  { label: "받지 않음", value: "none" },
];

/** 추가/삭제 가능한 담당자 폼의 값 모양. 폼 상태는 컨테이너(react-hook-form)가 보유. */
interface ContactsForm {
  contacts: { name: string; email: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 이미 사용 중인 아이디(데모용 정적 목록). 실제 소비 시스템은 이 자리를 API 호출로 대체한다.
const TAKEN_IDS = new Set(["admin", "root", "test", "user"]);

/**
 * AsyncInput 의 resolve 로 넘길 "아이디 중복 확인" — 컨테이너(하네스)의 책임.
 * 실제 소비 시스템에서는 여기서 axios/react-query 로 `GET /users/check?id=` 를 호출한다.
 * 데모에서는 네트워크 없이 지연만 흉내내며 AbortSignal 로 취소에 대응한다(격리망 준수).
 */
function checkUserIdAvailable(
  id: string,
  signal: AbortSignal,
): Promise<{ available: boolean }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => resolve({ available: !TAKEN_IDS.has(id.toLowerCase()) }),
      600,
    );
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

export function FormsPage() {
  const toast = useToast();

  // 순수 UI(폼) 상태 — 컨테이너가 보유. 실제 저장은 소비 시스템 몫.
  const [role, setRole] = useState("");
  const [notify, setNotify] = useState("important");
  const [perms, setPerms] = useState({ read: true, write: false, delete: false });
  const [agree, setAgree] = useState(false);

  // 스텝 셀렉터(다섯 단계) 상태 — 와인 감각 평가 예시.
  const [sweetness, setSweetness] = useState(1);
  const [tannin, setTannin] = useState(4);

  // 추가/삭제 가능한 담당자 폼 — 폼 상태·검증은 컨테이너(react-hook-form)가 보유.
  // AddableInputForm 은 fields 를 그리고, 추가/삭제 의도만 append/remove 로 넘긴다.
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactsForm>({
    defaultValues: { contacts: [{ name: "", email: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "contacts" });

  // 디바운스 비동기 검사(아이디 중복 확인) 상태 — 값은 컨테이너가 보유.
  const [userId, setUserId] = useState("");

  // 파일 업로드 상태
  const [files, setFiles] = useState<FileItem[]>([]);
  const idRef = useRef(0);
  // 업로드 취소용 AbortController 를 항목별로 보관.
  const controllers = useRef<Record<string, AbortController>>({});

  function patchFile(id: string, patch: Partial<FileItem>) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function handleSelect(picked: File[]) {
    for (const file of picked) {
      const id = `f${(idRef.current += 1)}`;
      const controller = new AbortController();
      controllers.current[id] = controller;

      // 1) 업로드 시작: 목록에 uploading 상태로 즉시 추가
      setFiles((prev) => [
        ...prev,
        { id, name: file.name, size: file.size, status: "uploading", progress: 0 },
      ]);

      // 2) 서버 업로드 → 진행률 반영 → 완료 시 { url, name } 을 항목에 채움
      uploadFile(file, {
        signal: controller.signal,
        onProgress: (percent) => patchFile(id, { progress: percent }),
      })
        .then((res) => {
          patchFile(id, { status: "done", url: res.url, name: res.name, size: res.size });
          toast.success(`업로드 완료: ${res.name}`);
        })
        .catch((err) => {
          if (err?.name === "AbortError") return; // 취소는 조용히 무시
          patchFile(id, { status: "error", error: err?.message ?? "업로드 실패" });
          toast.error(`업로드 실패: ${file.name}`);
        })
        .finally(() => {
          delete controllers.current[id];
        });
    }
  }

  function handleRemove(id: string) {
    // 업로드 중이면 취소, 완료된 objectURL 은 메모리 해제
    controllers.current[id]?.abort();
    delete controllers.current[id];
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  }

  // 저장 시 서버로 보낼 값의 모양(파일은 { url, name } 객체 배열로 정규화).
  const payload = {
    role,
    notify,
    permissions: Object.entries(perms)
      .filter(([, on]) => on)
      .map(([k]) => k),
    agree,
    taste: { sweetness, tannin },
    attachments: files
      .filter((f) => f.status === "done")
      .map((f) => ({ url: f.url, name: f.name })),
  };

  const uploading = files.some((f) => f.status === "uploading");
  const allChecked = perms.read && perms.write && perms.delete;
  const someChecked = perms.read || perms.write || perms.delete;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 선택형 입력들 */}
      <Card title="선택형 입력 (Select · Radio · Checkbox)">
        <div className="flex flex-col gap-5">
          <Select
            label="권한 등급"
            required
            placeholder="권한을 선택하세요"
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRole}
            hint="선택지에 disabled 항목을 섞을 수 있습니다."
          />

          <RadioGroup
            label="알림 수신"
            name="notify"
            value={notify}
            onChange={setNotify}
            options={NOTIFY_OPTIONS}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-text">권한 범위</legend>
            <Checkbox
              label="전체 선택"
              checked={allChecked}
              indeterminate={someChecked && !allChecked}
              onChange={(e) =>
                setPerms({
                  read: e.target.checked,
                  write: e.target.checked,
                  delete: e.target.checked,
                })
              }
            />
            <div className="flex flex-col gap-2 border-t border-line pt-2">
              <Checkbox
                label="읽기"
                checked={perms.read}
                onChange={(e) => setPerms((p) => ({ ...p, read: e.target.checked }))}
              />
              <Checkbox
                label="쓰기"
                checked={perms.write}
                onChange={(e) => setPerms((p) => ({ ...p, write: e.target.checked }))}
              />
              <Checkbox
                label="삭제"
                hint="되돌릴 수 없는 작업 권한입니다."
                checked={perms.delete}
                onChange={(e) => setPerms((p) => ({ ...p, delete: e.target.checked }))}
              />
            </div>
          </fieldset>

          <Checkbox
            label="위 설정 내용을 확인했습니다."
            checked={agree}
            error={!agree ? "저장하려면 동의가 필요합니다." : undefined}
            onChange={(e) => setAgree(e.target.checked)}
          />
        </div>
      </Card>

      {/* 스텝 셀렉터(다섯 단계) */}
      <Card title="스텝 셀렉터 (StepSelector)">
        <div className="flex flex-col gap-6">
          <StepSelector
            label="당도"
            required
            value={sweetness}
            onChange={setSweetness}
            minLabel="드라이"
            maxLabel="스위트"
          />
          <StepSelector
            label="탄닌"
            required
            help={
              <Tooltip content="포도 껍질·씨에서 오는 떫은 정도입니다.">
                <button type="button" aria-label="탄닌 도움말" className="inline-flex">
                  <Icons.IconInfoCircle className="h-4 w-4" />
                </button>
              </Tooltip>
            }
            value={tannin}
            onChange={setTannin}
            minLabel="매끄러운"
            maxLabel="떫음"
          />
        </div>
      </Card>

      {/* 추가/삭제 가능한 입력 폼 (AddableInputForm + react-hook-form) */}
      <Card title="추가 가능한 입력 폼 (AddableInputForm)">
        <form
          onSubmit={handleSubmit((values) =>
            toast.success(`담당자 ${values.contacts.length}명 저장 요청(데모)`),
          )}
          className="flex flex-col gap-4"
        >
          <AddableInputForm
            label="담당자"
            required
            hint="행을 추가/삭제할 수 있습니다. 최소 1개 · 최대 5개."
            items={fields}
            getKey={(field) => field.id}
            onAdd={() => append({ name: "", email: "" })}
            onRemove={remove}
            min={1}
            max={5}
            addLabel="담당자 추가"
            removeAriaLabel={(i) => `${i + 1}번째 담당자 삭제`}
          >
            {(_field, index) => (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="이름"
                  aria-label={`${index + 1}번째 담당자 이름`}
                  error={errors.contacts?.[index]?.name?.message}
                  {...register(`contacts.${index}.name`, {
                    required: "이름을 입력하세요.",
                  })}
                />
                <Input
                  placeholder="name@company.com"
                  aria-label={`${index + 1}번째 담당자 이메일`}
                  error={errors.contacts?.[index]?.email?.message}
                  {...register(`contacts.${index}.email`, {
                    required: "이메일을 입력하세요.",
                    pattern: { value: EMAIL_RE, message: "이메일 형식이 아닙니다." },
                  })}
                />
              </div>
            )}
          </AddableInputForm>

          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              담당자 저장
            </Button>
          </div>
        </form>
      </Card>

      {/* 디바운스 비동기 검사 입력 (AsyncInput) */}
      <Card title="비동기 검사 입력 (AsyncInput)">
        <div className="flex flex-col gap-4">
          <AsyncInput
            label="아이디"
            required
            placeholder="영문/숫자 4자 이상"
            hint="입력을 멈추면 중복을 확인합니다(디바운스 500ms)."
            value={userId}
            onChange={setUserId}
            debounceMs={500}
            minLength={4}
            resolve={checkUserIdAvailable}
            // 응답을 받아서 에러 처리(커스텀): 200 이지만 available=false 면 에러로 해석.
            getError={(res) =>
              res.available ? null : "이미 사용 중인 아이디입니다."
            }
            getSuccess={(res) => (res.available ? "사용 가능한 아이디입니다." : null)}
            getRequestError={() => "중복 확인에 실패했습니다. 잠시 후 다시 시도하세요."}
          />
          <p className="text-xs text-text-muted">
            이미 사용 중(데모): <code>admin · root · test · user</code>
          </p>
        </div>
      </Card>

      {/* 파일 업로드 + 결과 미리보기 */}
      <div className="flex flex-col gap-6">
        <Card title="파일 업로드 (API 동적 연동)">
          <div className="flex flex-col gap-4">
            <Input label="표시 이름" placeholder="예: 2026년 상반기 보고서" />
            <FileUpload
              label="첨부 파일"
              hint="드래그&드롭 또는 클릭. 업로드가 끝나면 서버 URL·파일명이 항목에 채워집니다."
              accept="image/*,.pdf"
              multiple
              items={files}
              onSelect={handleSelect}
              onRemove={handleRemove}
            />
          </div>
        </Card>

        <Card title="저장될 값 (미리보기)">
          <p className="mb-2 text-xs text-text-muted">
            첨부는 업로드 완료 항목만 <code>{"{ url, name }"}</code> 객체로 정규화됩니다.
          </p>
          <pre className="overflow-auto rounded-md bg-surface-muted p-3 text-xs text-text">
            {JSON.stringify(payload, null, 2)}
          </pre>
          <div className="mt-4 flex justify-end">
            <Button
              variant="primary"
              disabled={!agree || !role || uploading}
              onClick={() =>
                toast.success(
                  uploading ? "업로드가 끝난 뒤 저장하세요." : "저장 요청을 보냈습니다(데모).",
                )
              }
            >
              {uploading ? "업로드 중…" : "저장"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
