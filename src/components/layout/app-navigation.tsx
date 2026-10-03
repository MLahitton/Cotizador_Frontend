"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { appNavigationItems } from "@/config/app-navigation";
import { useAuth } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

export interface AppNavigationProps {
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
  collapsed?: boolean;
}

export function AppNavigation({
  onNavigate,
  variant = "desktop",
  collapsed = false,
}: AppNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const visibleNavigationItems = appNavigationItems.filter((item) => {
    if (item.adminOnly) {
      return user?.role === "ADMIN";
    }

    if (item.userOnly) {
      return user?.role !== "ADMIN";
    }

    return true;
  });

  return (
    <nav aria-label="Navegacion principal">
      <ul
        className={cn(
          "space-y-1",
          variant === "mobile" && "space-y-1.5",
          collapsed && variant === "desktop" && "space-y-2",
        )}
      >
        {visibleNavigationItems.map((item) => {
          const Icon = item.icon;

          const isActive =
            item.href !== null &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));

          const itemClasses = cn(
            "flex min-h-10 w-full items-center rounded-sm text-sm",
            "transition-colors duration-[var(--sng-duration-fast)] ease-[var(--sng-ease-standard)]",
            collapsed && variant === "desktop"
              ? "justify-center px-0 py-2"
              : "gap-3 px-3 py-2",
            isActive
              ? "bg-brand-soft font-semibold text-brand"
              : "text-foreground-secondary",
          );

          const itemTitle = item.disabled
            ? `${item.label} - Proximamente`
            : item.label;

          return (
            <li key={item.id}>
              {item.disabled || item.href === null ? (
                <div
                  aria-disabled="true"
                  title={collapsed ? itemTitle : undefined}
                  aria-label={collapsed ? itemTitle : undefined}
                  className={cn(itemClasses, "cursor-not-allowed text-disabled")}
                >
                  <Icon
                    aria-hidden="true"
                    className="shrink-0"
                    size={collapsed ? 20 : 18}
                    strokeWidth={1.75}
                  />

                  {!collapsed || variant !== "desktop" ? (
                    <>
                      <span className="min-w-0 flex-1">{item.label}</span>
                      <span className="text-xs font-medium text-disabled">
                        Proximamente
                      </span>
                    </>
                  ) : null}
                </div>
              ) : (
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={cn(
                    itemClasses,
                    !isActive &&
                      "hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="shrink-0"
                    size={collapsed ? 20 : 18}
                    strokeWidth={1.75}
                  />

                  {!collapsed || variant !== "desktop" ? (
                    <>
                      <span className="min-w-0 flex-1">{item.label}</span>
                      {isActive ? (
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-brand"
                        />
                      ) : null}
                    </>
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