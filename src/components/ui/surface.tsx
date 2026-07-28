import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export const surfaceVariants = cva("rounded-md border", {
  variants: {
    variant: {
      default: "border-border-subtle bg-surface",
      subtle: "border-border-subtle bg-surface-subtle",
      muted: "border-border-subtle bg-surface-muted",
      elevated: "border-border-subtle bg-surface-elevated shadow-sm",
    },
    padding: {
      none: "p-0",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

export interface SurfaceProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ className, padding, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(surfaceVariants({ padding, variant }), className)}
      {...props}
    />
  ),
);

Surface.displayName = "Surface";
