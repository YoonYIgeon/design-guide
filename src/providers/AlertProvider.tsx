import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertDialog, type AlertTone } from "../lib";

/**
 * 알림/확인 프로바이더 — 하네스(컨테이너) 레벨의 상태 관리.
 *
 * ⚠️ 라이브러리(src/lib)가 아니라 소비 시스템 쪽 코드입니다.
 *    프레젠테이션 전용 원칙상 열림 상태·Promise 해소 같은 로직은 여기에 두고,
 *    라이브러리는 그리기만(<AlertDialog>) 담당합니다.
 *    (docs/08-presentational-only.md)
 */

export interface AlertOptions {
  tone?: AlertTone;
  title?: ReactNode;
  confirmText?: string;
}

export interface ConfirmOptions extends AlertOptions {
  cancelText?: string;
}

export interface AlertApi {
  /** 단일 확인 다이얼로그. 확인을 누르면 resolve 됩니다. */
  alert: (message: ReactNode, options?: AlertOptions) => Promise<void>;
  /** 확인/취소 다이얼로그. 확인이면 true, 취소/닫기면 false 로 resolve 됩니다. */
  confirm: (message: ReactNode, options?: ConfirmOptions) => Promise<boolean>;
}

interface DialogState extends ConfirmOptions {
  message: ReactNode;
  isConfirm: boolean;
}

const AlertContext = createContext<AlertApi | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DialogState | null>(null);
  const [open, setOpen] = useState(false);
  // 확인/취소 결과를 호출부 Promise 로 되돌려줄 resolver.
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    resolver.current?.(result);
    resolver.current = null;
    setOpen(false);
  }, []);

  const openDialog = useCallback(
    (message: ReactNode, options: ConfirmOptions, isConfirm: boolean) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setState({ ...options, message, isConfirm });
        setOpen(true);
      }),
    [],
  );

  const api = useMemo<AlertApi>(
    () => ({
      alert: (message, options = {}) => openDialog(message, options, false).then(() => undefined),
      confirm: (message, options = {}) => openDialog(message, options, true),
    }),
    [openDialog],
  );

  return (
    <AlertContext.Provider value={api}>
      {children}
      {state && (
        <AlertDialog
          open={open}
          tone={state.tone}
          title={state.title ?? (state.isConfirm ? "확인" : "알림")}
          confirmText={state.confirmText}
          cancelText={state.isConfirm ? (state.cancelText ?? "취소") : undefined}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        >
          {state.message}
        </AlertDialog>
      )}
    </AlertContext.Provider>
  );
}

/** 알림/확인 API 훅. AlertProvider 하위에서만 사용합니다. */
export function useAlert(): AlertApi {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlert 는 <AlertProvider> 안에서만 사용할 수 있습니다.");
  return ctx;
}
