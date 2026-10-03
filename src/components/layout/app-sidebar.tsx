"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AppNavigation } from "@/components/layout/app-navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils/cn";

export function AppSidebar({
  defaultCollapsed = false,
}: {
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      className={cn(
        "hidden min-h-screen shrink-0 border-r border-border-subtle bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col",
        collapsed ? "w-[4.5rem]" : "w-[var(--sng-sidebar-width)]",
      )}
    >
      <div
        className={cn(
          "flex h-[var(--sng-header-height)] items-center gap-2",
          collapsed ? "flex-col justify-center px-2 py-2" : "justify-between px-5",
        )}
      >
        {collapsed ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-soft text-[0.625rem] font-bold uppercase tracking-wide text-accent-dark">
            sng
          </span>
        ) : (
          <BrandLogo priority />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("shrink-0", collapsed ? "h-7 w-7" : "h-9 w-9")}
          title={collapsed ? "Expandir navegacion" : "Contraer navegacion"}
          aria-label={collapsed ? "Expandir navegacion" : "Contraer navegacion"}
          aria-pressed={collapsed}
          onClick={() => setCollapsed((current) => !current)}
        >
          <ToggleIcon aria-hidden="true" size={18} strokeWidth={1.75} />
        </Button>
      </div>
      <Separator />
      <div className={cn("flex-1 overflow-y-auto py-5", collapsed ? "px-3" : "px-4")}>
        <AppNavigation collapsed={collapsed} />
      </div>
      <div
        className={cn(
          "border-t border-border-subtle py-4",
          collapsed ? "px-3" : "px-6",
        )}
      >
        {collapsed ? (
          <p className="text-center text-[0.625rem] font-semibold uppercase text-muted">
            SNG
          </p>
        ) : (
          <p className="text-xs font-medium text-muted">Cotizador interno</p>
        )}
      </div>
    </aside>
  );
}