"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavigationItems } from "@/config/app-navigation";
import { cn } from "@/lib/utils/cn";

export interface AppNavigationProps {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

export function AppNavigation({
  onNavigate,
  variant = "desktop",
}: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal">
      <ul className={cn("space-y-1", variant === "mobile" && "space-y-1.5")}>
        {appNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href !== null && pathname === item.href;
          const itemClasses = cn(
            "flex min-h-10 w-full items-center gap-3 rounded-sm px-3 py-2 text-sm",
            "transition-colors duration-[var(--sng-duration-fast)] ease-[var(--sng-ease-standard)]",
            isActive
              ? "bg-brand-soft font-semibold text-brand"
              : "text-foreground-secondary",
          );

          return (
            <li key={item.id}>
              {item.disabled || item.href === null ? (
                <div
                  aria-disabled="true"
                  className={cn(itemClasses, "cursor-not-allowed text-disabled")}
                >
                  <Icon
                    aria-hidden="true"
                    className="shrink-0"
                    size={18}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  <span className="text-xs font-medium text-disabled">
                    Próximamente
                  </span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    itemClasses,
                    !isActive &&
                      "hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="shrink-0"
                    size={18}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  {isActive ? (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 rounded-full bg-brand"
                    />
                  ) : null}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
