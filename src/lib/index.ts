/**
 * @company/admin-ui — 라이브러리 공개 진입점.
 * 소비 시스템은 여기서 export 되는 것만 사용합니다. (docs/03-getting-started.md)
 */
export { Button, type ButtonProps } from "./components/Button";
export { Badge, type BadgeProps } from "./components/Badge";
export { Card, type CardProps, type CardHeaderTone } from "./components/Card";
export { StatCard, type StatCardProps } from "./components/StatCard";
export { Input, type InputProps } from "./components/Input";
export { Textarea, type TextareaProps } from "./components/Textarea";
export { Select, type SelectProps, type SelectOption } from "./components/Select";
export { Checkbox, type CheckboxProps } from "./components/Checkbox";
export { RadioGroup, type RadioGroupProps, type RadioOption } from "./components/Radio";
export { StepSelector, type StepSelectorProps } from "./components/StepSelector";
export {
  AddableInputForm,
  type AddableInputFormProps,
} from "./components/AddableInputForm";
export {
  FileUpload,
  type FileUploadProps,
  type FileItem,
  type FileStatus,
} from "./components/FileUpload";
export { LoginForm, type LoginFormProps } from "./components/LoginForm";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState";
export {
  DataTable,
  type DataTableProps,
  type DataTablePagination,
  type Column,
} from "./components/DataTable";
export { Modal, type ModalProps, type ModalSize } from "./components/Modal";
export {
  Toast,
  ToastViewport,
  type ToastProps,
  type ToastViewportProps,
  type ToastTone,
  type ToastPosition,
} from "./components/Toast";
export {
  AlertDialog,
  type AlertDialogProps,
  type AlertTone,
} from "./components/AlertDialog";
export { PromptDialog, type PromptDialogProps } from "./components/PromptDialog";
export {
  Tooltip,
  type TooltipProps,
  type TooltipPlacement,
} from "./components/Tooltip";
export { Markdown, type MarkdownProps } from "./components/Markdown";
export {
  AdminShell,
  type AdminShellProps,
  type AdminShellUser,
  type NavItem,
} from "./components/AdminShell";

// UI 상태 프로바이더 — 프레젠테이션 전용 원칙의 명시적 예외(순수 UI 상태만 관리).
// (docs/08-presentational-only.md)
export {
  ToastProvider,
  useToast,
  type ToastApi,
  type ToastOptions,
} from "./providers/ToastProvider";
export {
  AlertProvider,
  useAlert,
  type AlertApi,
  type AlertOptions,
  type ConfirmOptions,
} from "./providers/AlertProvider";

export { cn } from "./utils/cn";
export * as Icons from "./icons";
