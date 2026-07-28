import { forwardRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export interface SeparatorProps extends HTMLAttributes<HTMLDivElement> {
  decorative?: boolean;
  orientation?: "horizontal" | "vertical";
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
  (
    {
      className,
      decorative = true,
      orientation = "horizontal",
      ...props
    },
    ref,
  ) => (
    <div
      {...props}
      ref={ref}
      role={decorative ? undefined : "separator"}
      aria-hidden={decorative ? true : undefined}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border-subtle",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
    />
  ),
);

Separator.displayName = "Separator";
