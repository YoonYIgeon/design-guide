import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Modal } from "./Modal";

export interface PromptDialogProps {
  open: boolean;
  /** 다이얼로그 제목. 문자열 또는 노드. */
  title: ReactNode;
  /** 입력 위에 표시할 설명(선택). */
  description?: ReactNode;
  /** 입력 레이블. */
  label?: ReactNode;
  placeholder?: string;
  /** 열릴 때 채워질 초기값. */
  defaultValue?: string;
  /** input type (text/email/number 등). 기본 "text". */
  inputType?: string;
  /** 빈 값이면 확인 버튼 비활성(기본 false). */
  required?: boolean;
  /** 입력 아래 힌트. */
  hint?: ReactNode;
  /** 표시할 에러 메시지. 값 판단은 소비 시스템이 함. */
  error?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** 확인 진행 중(스피너/중복 클릭 차단). 소비 시스템이 제어. */
  loading?: boolean;
  /**
   * 확인 시 입력값을 전달합니다. 실제 처리(검증·저장 등)는 소비 시스템의 몫입니다.
   * 이 컴포넌트는 입력을 그리고 값만 넘겨줄 뿐입니다. (docs/08-presentational-only.md)
   */
  onSubmit: (value: string) => void;
  /** 취소·닫기 의도. */
  onCancel: () => void;
}

/**
 * 프레젠테이션 전용 입력 다이얼로그.
 * - Modal + Input 위에 확인/취소 버튼을 얹어 "값 하나를 입력받는" 흔한 흐름을 담습니다.
 * - 보유 상태: 입력값이라는 순수 UI 상태뿐(LoginForm 과 동일한 층위).
 * - 표시 자리(title/description/label/hint/error)는 노드로 받습니다.
 *   (docs/11-flexible-composition.md)
 */
export function PromptDialog({
  open,
  title,
  description,
  label,
  placeholder,
  defaultValue = "",
  inputType = "text",
  required = false,
  hint,
  error,
  confirmText = "확인",
  cancelText = "취소",
  loading = false,
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // 열릴 때마다 초기값으로 리셋하고 입력에 포커스(Modal 이 패널에 포커스를 준 뒤 이동).
  useEffect(() => {
    if (!open) return;
    setValue(defaultValue);
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open, defaultValue]);

  const canSubmit = !loading && (!required || value.trim().length > 0);

  function submit() {
    if (!canSubmit) return;
    onSubmit(value);
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  return (
    <Modal
      open={open}
      title={title}
      dismissible={!loading}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            loading={loading}
            disabled={!canSubmit}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-3" noValidate>
        {description && <p className="text-sm text-text-muted">{description}</p>}
        <Input
          ref={inputRef}
          type={inputType}
          label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required={required}
          hint={hint}
          error={error}
        />
      </form>
    </Modal>
  );
}
