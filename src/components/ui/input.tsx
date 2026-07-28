import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm text-foreground",
        "placeholder:text-muted",
        "transition-colors duration-[var(--sng-duration-fast)] ease-[var(--sng-ease-standard)]",
        "hover:border-border-strong",
        "read-only:border-border-subtle read-only:bg-surface-subtle",
        "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-[var(--sng-color-disabled-background)] disabled:text-disabled",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
