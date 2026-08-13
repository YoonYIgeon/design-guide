import { useCallback, useRef, useState } from "react";
import type { AsyncInputStatus } from "../components/AsyncInput";

/** 검사 중(loading)일 때의 기본 검증 실패 문구. */
const DEFAULT_PENDING_MESSAGE = "확인이 끝날 때까지 기다려 주세요.";
/** 검사 실패(error)일 때의 기본 검증 실패 문구. */
const DEFAULT_INVALID_MESSAGE = "입력값 확인에 실패했습니다. 다시 확인해 주세요.";

export interface UseAsyncValidationOptions {
  /** 검사 중(`loading`)일 때 `validate` 가 돌려줄 문구. */
  pendingMessage?: string;
  /** 검사 실패(`error`)일 때 `validate` 가 돌려줄 문구. */
  invalidMessage?: string;
  /**
   * 상태가 바뀔 때마다 호출됩니다. 폼 라이브러리가 검증을 **다시 돌리게** 하는 자리입니다.
   * react-hook-form 이라면 `() => trigger("userId")` 를 넘깁니다.
   */
  revalidate?: (status: AsyncInputStatus) => void;
}

export interface AsyncValidation {
  /** `AsyncInput` 이 통지한 최신 검사 상태. */
  status: AsyncInputStatus;
  /** 검사 중(응답 대기)인가. */
  isPending: boolean;
  /**
   * 제출을 막을 이유가 없는가(= 검사 중도 실패도 아님). `validate` 와 같은 기준.
   * 손대지 않은 prefill 값(`idle`)도 `true` 다 — 이미 저장된 값까지 막지 않기 위해서.
   */
  isValid: boolean;
  /** 백엔드 검사를 **실제로 통과**했는가(`success`). "확인해야만 제출 가능"이면 이걸 쓴다. */
  isConfirmed: boolean;
  /** `AsyncInput` 의 `onStatusChange` 에 그대로 연결합니다. */
  onStatusChange: (status: AsyncInputStatus) => void;
  /**
   * 폼 라이브러리의 검증 룰에 그대로 꽂는 함수(통과 시 `true`, 실패 시 문구).
   * react-hook-form 이라면 `rules={{ validate }}`.
   *
   * 참조가 고정돼 있고 최신 상태를 ref 로 읽으므로, 폼 라이브러리가 등록 시점의 함수를
   * 오래 들고 있어도 낡은 상태를 보지 않습니다.
   *
   * ⚠️ **`resolver`(zodResolver 등)를 쓰는 폼에서는 이 룰이 무시됩니다.** react-hook-form 은
   * resolver 가 있으면 필드 레벨 `rules` 를 아예 돌리지 않습니다. 그런 폼에서는
   * `AsyncInput` 의 기본 제출 차단(`blockSubmitWhileInvalid`)에 맡기고, 버튼은
   * `isValid`/`isConfirmed` 로 막으세요. 자세한 내용은 `docs/10-form-inputs.md`.
   */
  validate: () => true | string;
}

/**
 * `AsyncInput` 의 비동기 검사 상태를 **폼 검증에 연결**하는 훅.
 *
 * `AsyncInput` 은 검사 중·검사 실패인 동안 내부 `<input>` 을 네이티브 제약 검증으로 무효화하지만,
 * 그것만으로는 **네이티브 제출을 거치지 않는 경로**(`<button type="button" onClick={handleSubmit()}>`
 * 처럼 폼 라이브러리가 직접 제출하는 패턴)를 막지 못합니다. 그 경로까지 막으려면 검사 상태가
 * 폼 라이브러리의 **검증 파이프라인**에 들어가야 하고, 이 훅이 그 연결을 담당합니다.
 *
 * 프레젠테이션 전용 경계(docs/08): 순수 UI 상태만 다루며 특정 폼 라이브러리에 의존하지 않습니다.
 *
 * ```tsx
 * const userId = useAsyncValidation({ revalidate: () => trigger("userId") });
 *
 * <Controller
 *   name="userId"
 *   control={control}
 *   rules={{ required: "아이디를 입력하세요.", validate: userId.validate }}
 *   render={({ field }) => (
 *     <AsyncInput
 *       value={field.value}
 *       onChange={field.onChange}
 *       resolve={checkUserIdAvailable}
 *       onStatusChange={userId.onStatusChange}
 *     />
 *   )}
 * />
 * <Button type="submit" disabled={!userId.isConfirmed}>가입</Button>
 * ```
 */
export function useAsyncValidation(
  options: UseAsyncValidationOptions = {},
): AsyncValidation {
  const [status, setStatus] = useState<AsyncInputStatus>("idle");

  // `validate` 는 참조가 고정돼야 하므로(폼 라이브러리가 등록 시점 함수를 붙들고 있다)
  // 최신 상태·옵션을 ref 로 미러링해 읽는다.
  const statusRef = useRef(status);
  statusRef.current = status;

  const optsRef = useRef(options);
  optsRef.current = options;

  const onStatusChange = useCallback((next: AsyncInputStatus) => {
    // revalidate 가 동기적으로 validate 를 다시 부를 수 있으므로 ref 를 setState 보다 먼저 갱신한다.
    statusRef.current = next;
    setStatus(next);
    optsRef.current.revalidate?.(next);
  }, []);

  const validate = useCallback((): true | string => {
    const current = statusRef.current;
    if (current === "loading") {
      return optsRef.current.pendingMessage ?? DEFAULT_PENDING_MESSAGE;
    }
    if (current === "error") {
      return optsRef.current.invalidMessage ?? DEFAULT_INVALID_MESSAGE;
    }
    // idle(빈 값·최소 길이 미만·로컬 검증 실패로 검사를 건너뛴 경우)은 여기서 막지 않는다.
    // 그 값들은 컨테이너의 required/minLength 등 자체 룰이 잡는 자리다.
    return true;
  }, []);

  return {
    status,
    isPending: status === "loading",
    isValid: status !== "loading" && status !== "error",
    isConfirmed: status === "success",
    onStatusChange,
    validate,
  };
}
