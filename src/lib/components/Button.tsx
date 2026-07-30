import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../utils/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
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

/**
 * 액션 버튼. loading 시 중복 클릭을 차단합니다.
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
          sizeClass[size],
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
