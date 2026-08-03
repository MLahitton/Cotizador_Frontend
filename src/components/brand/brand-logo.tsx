import Image from "next/image";

import steelAndGlassLogo from "@/lib/Images/steel-and-glass-logo.webp";
import { cn } from "@/lib/utils/cn";

export interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  priority?: boolean;
}

export function BrandLogo({
  className,
  compact = false,
  priority = false,
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "flex items-center overflow-hidden",
        compact ? "h-10 w-40" : "h-16 w-full max-w-56",
        className,
      )}
    >
      <Image
        src={steelAndGlassLogo}
        alt="Steel and Glass"
        priority={priority}
        className={cn(
          "max-w-none shrink-0 object-contain",
          compact ? "h-auto w-48" : "h-auto w-64",
        )}
      />
    </span>
  );
}
