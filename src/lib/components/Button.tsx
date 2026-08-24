import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /**
   * 아이콘만 넣는 정사각형 버튼. 가로 패딩을 없애고 높이와 같은 너비를 줍니다
   * (sm: 32px, md: 40px). 텍스트 라벨이 없으므로 `aria-label` 을 반드시 주세요.
   */
  square?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover border-transparent",
  secondary:
    "bg-surface text-text hover:bg-surface-muted border-line",
  danger: "bg-danger text-white hover:bg-danger-hover border-transparent",
  ghost: "bg-transparent text-text hover:bg-surface-muted border-transparent",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

/** square 일 때의 크기. 가로 패딩 대신 높이와 같은 너비로 정사각형을 만듭니다. */
const squareSizeClass: Record<Size, string> = {
  sm: "h-8 w-8 p-0 text-sm gap-1.5",
  md: "h-10 w-10 p-0 text-sm gap-2",
};

/**
 * 액션 버튼. loading 시 중복 클릭을 차단합니다.
 *
 * 아이콘만 넣을 때는 `square` 를 켜면 가로 패딩이 사라지고 정사각형이 됩니다.
 * 이때 버튼에는 읽을 텍스트가 없으므로 `aria-label` 을 함께 주세요.
 * ```tsx
 * <Button variant="ghost" size="sm" square aria-label="삭제">
 *   <IconTrash width={16} height={16} />
 * </Button>
 * ```
 *
 * `type` 기본값은 `"button"` 입니다 — HTML 기본값(`"submit"`)을 그대로 두면
 * `<form>` 안에 놓인 모든 버튼(테이블 페이지네이션, 툴바 액션 등)이 클릭만으로
 * 폼을 제출해 버립니다. 제출 버튼은 `type="submit"` 을 명시하세요.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      loading = false,
      square = false,
      type = "button",
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center rounded-md border font-medium",
          "transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
          variantClass[variant],
          square ? squareSizeClass[size] : sizeClass[size],
          className,
        )}
        {...rest}
      >
        {loading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
