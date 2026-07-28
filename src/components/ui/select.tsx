import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm text-foreground",
        "transition-colors duration-[var(--sng-duration-fast)] ease-[var(--sng-ease-standard)]",
        "hover:border-border-strong",
        "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-[var(--sng-color-disabled-background)] disabled:text-disabled",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = "Select";
