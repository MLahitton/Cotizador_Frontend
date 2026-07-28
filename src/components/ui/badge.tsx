import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-surface-muted text-foreground-secondary",
        brand: "bg-brand-soft text-brand",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
      },
      size: {
        sm: "min-h-5 px-2 text-xs",
        md: "min-h-6 px-2.5 text-sm",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, size, tone, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ size, tone }), className)}
      {...props}
    />
  ),
);

Badge.displayName = "Badge";
