import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  [
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-sm font-semibold",
    "transition-colors duration-[var(--sng-duration-fast)] ease-[var(--sng-ease-standard)]",
    "disabled:cursor-not-allowed disabled:bg-[var(--sng-color-disabled-background)] disabled:text-disabled",
    "disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-foreground hover:bg-brand-hover active:bg-brand-active",
        secondary:
          "border border-border bg-brand-soft text-brand hover:bg-surface-muted active:bg-surface-muted",
        outline:
          "border border-border bg-surface text-foreground hover:bg-surface-subtle active:bg-surface-muted",
        ghost:
          "bg-transparent text-foreground-secondary hover:bg-brand-soft hover:text-foreground active:bg-surface-muted",
        danger:
          "bg-danger text-brand-foreground hover:brightness-90 active:brightness-75",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-base",
        icon: "h-10 w-10 p-0 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, variant, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ size, variant }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
