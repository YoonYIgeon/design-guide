import { useId, useRef, useState, type DragEvent, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useOptionalToast } from "../providers/ToastProvider";
import {
  IconAlertCircle,
  IconCheckCircle,
  IconClose,
  IconExternalLink,
  IconFileText,
  IconUpload,
} from "../icons";

/** 업로드 진행 상태. */
export type FileStatus = "uploading" | "done" | "error";

/**
 * 목록에 그릴 파일 한 건. 서버 업로드가 끝나면 컨테이너가 이 항목을
 * `{ status: "done", url, name }` 형태로 채워 넣습니다(= API 연동 결과 객체).
 */
export interface FileItem {
  /** 리스트 안정성/삭제·취소 식별용 키(컨테이너가 발급). */
  id: string;
  /** 표시할 파일명. */
  name: string;
  status: FileStatus;
  /** 업로드 완료 시 서버가 돌려준 접근 URL. */
  url?: string;
  /** 바이트 크기(선택). */
  size?: number;
  /** 업로드 중 진행률 0~100(선택, 없으면 진행 막대는 불확정 표시). */
  progress?: number;
  /** 실패 시 표시할 메시지. */
  error?: string;
}

export interface FileUploadProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** 현재 파일 목록(제어값). 업로드/취소/삭제 반영은 컨테이너 책임. */
  items: FileItem[];
  /**
   * 사용자가 파일을 고르거나 드롭했을 때 원본 File 목록을 넘깁니다.
   * `accept` 에 맞지 않는 파일은 여기로 오지 않습니다(→ onReject).
   * 실제 서버 업로드(HTTP)는 컨테이너가 수행하고 결과를 items 로 되돌립니다.
   * (docs/08-presentational-only.md)
   */
  onSelect: (files: File[]) => void;
  /**
   * `accept` 에 맞지 않아 걸러진 파일 목록.
   *
   * 주지 않으면 기본 동작으로 **토스트 에러**를 띄웁니다(ToastProvider 가 있을 때).
   * 목록에 에러 항목으로 남기는 등 다르게 처리하려면 이 콜백을 주세요 —
   * 주는 순간 기본 토스트는 뜨지 않습니다.
   */
  onReject?: (files: File[]) => void;
  /** 개별 항목 제거/취소 의도. */
  onRemove?: (id: string) => void;
  /**
   * 허용 확장자/타입(예: "image/*,.pdf").
   * `<input accept>` 는 파일 선택창의 힌트일 뿐이라("모든 파일" 선택·드래그&드롭으로 우회됨)
   * 컴포넌트가 선택/드롭된 파일을 같은 규칙으로 다시 걸러냅니다.
   */
  accept?: string;
  /** 다중 선택 허용(기본 true). */
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** 읽기 전용: 드롭존/삭제 없이 업로드된 파일 목록만 보여줍니다. */
  readOnly?: boolean;
  /** 드롭존 안내 문구 커스터마이즈. */
  dropLabel?: ReactNode;
  /** 업로드 완료된 이미지 항목을 아이콘 대신 썸네일로 보여줄지(기본 false). */
  preview?: boolean;
  className?: string;
}

function formatBytes(bytes?: number): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

const IMAGE_NAME_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i;

function isImageFile(name: string): boolean {
  return IMAGE_NAME_RE.test(name);
}

/**
 * `accept` 한 토큰이 파일과 맞는지 검사합니다.
 * - `.pdf` : 파일명 확장자(대소문자 무시)
 * - `image/*` : MIME 대분류
 * - `application/pdf` : MIME 완전 일치
 * - `*` 또는 `star/star` 형태의 전체 와일드카드 : 전부 허용
 *
 * 드롭된 파일은 `type` 이 빈 문자열일 수 있어(브라우저가 못 알아본 경우)
 * MIME 토큰은 매칭되지 않고 확장자 토큰만 통과합니다.
 */
function matchesAcceptToken(file: File, token: string): boolean {
  if (token === "*" || token === "*/*") return true;
  if (token.startsWith(".")) return file.name.toLowerCase().endsWith(token);

  const type = file.type.toLowerCase();
  if (!type) return false;
  if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
  return type === token;
}

/** onReject 를 주지 않았을 때 띄우는 기본 토스트 문구. */
function rejectMessage(rejected: File[], accept?: string): string {
  const [first, ...rest] = rejected;
  const names = rest.length > 0 ? `${first.name} 외 ${rest.length}개` : first.name;
  return accept
    ? `${names} — 허용 형식이 아닙니다(${accept}).`
    : `${names} — 업로드할 수 없는 파일입니다.`;
}

/** `accept` 문자열(비어 있으면 전부 허용)에 파일이 부합하는지. */
export function isFileAccepted(file: File, accept?: string): boolean {
  const tokens = (accept ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.some((token) => matchesAcceptToken(file, token));
}

/**
 * 파일 업로드(드래그&드롭 + 찾아보기) — 프레젠테이션 전용.
 *
 * 이 컴포넌트는 네트워크를 모릅니다. 선택된 파일을 onSelect 로 넘기면,
 * 컨테이너가 API(예: src/api 의 uploadFile)로 업로드하고 그 결과
 * `{ url, name }` 객체를 items 에 반영합니다. 업로드 중/성공/실패 상태는
 * FileItem.status 로 그립니다. (docs/09-data-fetching.md)
 */
export function FileUpload({
  label,
  hint,
  error,
  items,
  onSelect,
  onReject,
  onRemove,
  accept,
  multiple = true,
  disabled = false,
  required,
  readOnly = false,
  dropLabel = "파일을 끌어다 놓거나 클릭해 선택하세요",
  preview = false,
  className,
}: FileUploadProps) {
  const autoId = useId();
  const inputId = autoId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // onReject 미지정 시의 기본 안내용. ToastProvider 가 없으면 null(→ 조용히 무시).
  const toast = useOptionalToast();

  function emit(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    // `<input accept>` 은 선택창 힌트일 뿐이라("모든 파일" 선택·드래그&드롭으로 우회됨)
    // 여기서 같은 규칙으로 한 번 더 걸러야 accept 밖 파일이 올라가지 않는다.
    const accepted: File[] = [];
    const rejected: File[] = [];
    for (const file of Array.from(fileList)) {
      (isFileAccepted(file, accept) ? accepted : rejected).push(file);
    }

    if (rejected.length > 0) {
      if (onReject) onReject(rejected);
      else toast?.error(rejectMessage(rejected, accept));
    }
    if (accepted.length === 0) return;
    onSelect(multiple ? accepted : accepted.slice(0, 1));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    emit(e.dataTransfer.files);
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-sm font-medium text-text">
          {label}
          {required && <small className="ml-0.5 font-semibold text-primary">(필수)</small>}
        </span>
      )}

      {/* 드롭존 — 읽기 전용에서는 숨기고 파일 목록만 노출 */}
      {!readOnly && (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={describedBy}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-md border px-4 py-6 text-center",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-primary/60 hover:bg-surface-muted",
          // 평소엔 점선(placeholder 느낌), 에러일 때만 실선.
          dragging
            ? "border-dashed border-primary bg-primary/5"
            : error
              ? "border-solid border-danger"
              : "border-dashed border-line",
        )}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-muted">
          <IconUpload width={20} height={20} />
        </span>
        <span className="text-sm text-text">{dropLabel}</span>
        {accept && (
          <span className="text-xs text-text-muted">허용 형식: {accept}</span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          required={required && items.length === 0}
          className="sr-only"
          onChange={(e) => {
            emit(e.target.files);
            // 같은 파일을 다시 선택할 수 있도록 값 초기화
            e.target.value = "";
          }}
        />
      </div>
      )}

      {/* 읽기 전용인데 항목이 없으면 빈 상태 안내 */}
      {readOnly && items.length === 0 && (
        <p className="text-sm text-text-muted">첨부된 파일이 없습니다.</p>
      )}

      {/* 선택/업로드된 파일 목록 */}
      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-line bg-surface px-3 py-2"
            >
              {preview && item.status === "done" && item.url && isImageFile(item.name) ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-auto w-9 shrink-0 rounded"
                />
              ) : (
                <span
                  className={cn(
                    "shrink-0",
                    item.status === "done"
                      ? "text-success"
                      : item.status === "error"
                        ? "text-danger"
                        : "text-text-muted",
                  )}
                >
                  {item.status === "done" ? (
                    <IconCheckCircle width={18} height={18} />
                  ) : item.status === "error" ? (
                    <IconAlertCircle width={18} height={18} />
                  ) : (
                    <IconFileText width={18} height={18} />
                  )}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm text-text">{item.name}</span>
                  {item.size != null && (
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatBytes(item.size)}
                    </span>
                  )}
                </div>

                {item.status === "uploading" && (
                  <div
                    className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-muted"
                    role="progressbar"
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-200"
                      style={{ width: `${item.progress ?? 40}%` }}
                    />
                  </div>
                )}

                {item.status === "error" && (
                  <p className="mt-0.5 text-xs text-danger">
                    {item.error ?? "업로드에 실패했습니다."}
                  </p>
                )}

                {item.status === "done" && item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconExternalLink width={12} height={12} />
                    열기
                  </a>
                )}
              </div>

              {onRemove && !readOnly && (
                <button
                  type="button"
                  aria-label={`${item.name} ${item.status === "uploading" ? "취소" : "삭제"}`}
                  onClick={() => onRemove(item.id)}
                  className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <IconClose width={16} height={16} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
