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
    <Image
      src={steelAndGlassLogo}
      alt="Steel and Glass"
      priority={priority}
      className={cn(
        "object-contain",
        compact ? "h-8 w-32" : "h-11 w-48",
        className,
      )}
    />
  );
}
