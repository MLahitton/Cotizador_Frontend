import { BrandLogo } from "@/components/brand/brand-logo";
import { AppNavigation } from "@/components/layout/app-navigation";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  return (
    <aside className="hidden min-h-screen w-[var(--sng-sidebar-width)] shrink-0 border-r border-border-subtle bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex h-[var(--sng-header-height)] items-center px-6">
        <BrandLogo priority />
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <AppNavigation />
      </div>
      <div className="border-t border-border-subtle px-6 py-4">
        <p className="text-xs font-medium text-muted">Cotizador interno</p>
      </div>
    </aside>
  );
}
