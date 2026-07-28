import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

export interface AppShellProps {
  children: ReactNode;
  displayName: string;
  email: string;
  initials: string;
  onSignOut: () => void;
}

export function AppShell({
  children,
  displayName,
  email,
  initials,
  onSignOut,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[var(--sng-z-toast)] focus:not-sr-only focus:rounded-sm focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-foreground"
      >
        Saltar al contenido principal
      </a>
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <AppHeader
          displayName={displayName}
          email={email}
          initials={initials}
          onSignOut={onSignOut}
        />
        <main
          id="main-content"
          className="min-w-0 px-[var(--sng-content-gutter-mobile)] py-6 md:px-[var(--sng-content-gutter-tablet)] md:py-8 lg:px-[var(--sng-content-gutter-desktop)]"
        >
          <div className="mx-auto w-full max-w-[var(--sng-content-max-width)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
