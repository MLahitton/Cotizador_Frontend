import { forwardRef, type ReactNode } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type IconButtonSize = "sm" | "md" | "lg";

const squareSizeClasses: Record<IconButtonSize, string> = {
  sm: "w-9 px-0",
  md: "w-10 px-0",
  lg: "w-11 px-0",
};

export interface IconButtonProps
  extends Omit<ButtonProps, "aria-label" | "children" | "size"> {
  children: ReactNode;
  label: string;
  size?: IconButtonSize;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, className, label, size = "md", ...props }, ref) => (
    <Button
      ref={ref}
      aria-label={label}
      size={size}
      className={cn(squareSizeClasses[size], className)}
      {...props}
    >
      {children}
    </Button>
  ),
);

IconButton.displayName = "IconButton";
