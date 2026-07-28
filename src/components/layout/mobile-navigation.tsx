import { Menu } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AppNavigation } from "@/components/layout/app-navigation";
import { Separator } from "@/components/ui/separator";

export function MobileNavigation() {
  return (
    <details className="relative shrink-0 lg:hidden">
      <summary
        aria-label="Abrir navegación principal"
        className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-sm text-foreground-secondary transition-colors marker:hidden hover:bg-surface-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
      >
        <Menu aria-hidden="true" size={22} strokeWidth={1.75} />
      </summary>
      <div className="absolute left-0 top-12 z-[var(--sng-z-dropdown)] w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border-subtle bg-surface p-4 shadow-md">
        <BrandLogo compact />
        <Separator className="my-4" />
        <AppNavigation variant="mobile" />
      </div>
    </details>
  );
}
