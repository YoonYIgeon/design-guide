import { useRef, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  FileUpload,
  Icons,
  Input,
  RadioGroup,
  Select,
  StepSelector,
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
            help={<Icons.IconInfoCircle className="h-4 w-4" />}
            value={tannin}
            onChange={setTannin}
            minLabel="매끄러운"
            maxLabel="떫음"
          />
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
