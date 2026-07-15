import type { ReactNode } from "react";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheckCircle,
  IconInfoCircle,
} from "../icons";
import { cn } from "../utils/cn";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type AlertTone = "info" | "success" | "warning" | "danger";

export interface AlertDialogProps {
  open: boolean;
  /** 시각적 톤(색/아이콘/확인 버튼 변형). */
  tone?: AlertTone;
  title: ReactNode;
  /** 본문 메시지. */
  children: ReactNode;
  confirmText?: string;
  /**
   * 취소 버튼 라벨. 넘기면 확인/취소(confirm), 생략하면 단일 확인(alert)으로 그립니다.
   */
  cancelText?: string;
  /** 확인 진행 중(스피너/중복 클릭 차단). 소비 시스템이 제어. */
  loading?: boolean;
  onConfirm: () => void;
  /** 취소·닫기 의도. confirm 형태일 때만 취소 버튼을 노출합니다. */
  onCancel: () => void;
}

const toneClass: Record<AlertTone, string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

const toneIcon: Record<AlertTone, typeof IconInfoCircle> = {
  info: IconInfoCircle,
  success: IconCheckCircle,
  warning: IconAlertTriangle,
  danger: IconAlertCircle,
};

/**
 * 프레젠테이션 전용 확인/알림 다이얼로그.
 * - Modal 위에 톤·아이콘·확인/취소 버튼을 얹은 형태.
 * - cancelText 유무로 confirm(확인+취소) / alert(확인만) 을 결정합니다.
 * - 판단·부수효과는 onConfirm/onCancel 을 받는 소비 시스템(프로바이더)이 처리합니다.
 *   (docs/08-presentational-only.md)
 */
export function AlertDialog({
  open,
  tone = "info",
  title,
  children,
  confirmText = "확인",
  cancelText,
  loading = false,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const Icon = toneIcon[tone];
  const isConfirm = cancelText != null;

  return (
    <Modal
      open={open}
      size="sm"
      title={
        <span className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              toneClass[tone],
            )}
          >
            <Icon width={18} height={18} />
          </span>
          {title}
        </span>
      }
      dismissible={!loading}
      onClose={onCancel}
      footer={
        <>
          {isConfirm && (
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-text-muted">{children}</p>
    </Modal>
  );
}
