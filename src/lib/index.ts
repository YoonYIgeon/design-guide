/**
 * @company/admin-ui — 라이브러리 공개 진입점.
 * 소비 시스템은 여기서 export 되는 것만 사용합니다. (docs/03-getting-started.md)
 */
export { Button, type ButtonProps } from "./components/Button";
export { Badge, type BadgeProps } from "./components/Badge";
export { Card, type CardProps } from "./components/Card";
export { StatCard, type StatCardProps } from "./components/StatCard";
export { Input, type InputProps } from "./components/Input";
export { LoginForm, type LoginFormProps } from "./components/LoginForm";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState";
export { DataTable, type DataTableProps, type Column } from "./components/DataTable";
export { Modal, type ModalProps } from "./components/Modal";
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
export { Markdown, type MarkdownProps } from "./components/Markdown";
export {
  AdminShell,
  type AdminShellProps,
  type NavItem,
} from "./components/AdminShell";

export { cn } from "./utils/cn";
export * as Icons from "./icons";
