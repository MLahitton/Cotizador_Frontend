import { ChevronDown, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface UserAccountProps {
  displayName: string;
  email: string;
  initials: string;
  onSignOut: () => void;
}

export function UserAccount({
  displayName,
  email,
  initials,
  onSignOut,
}: UserAccountProps) {
  return (
    <details className="relative shrink-0">
      <summary
        aria-label={`Abrir menú de cuenta de ${displayName}`}
        className="flex cursor-pointer list-none items-center gap-2 rounded-sm p-1 text-foreground transition-colors marker:hidden hover:bg-surface-muted [&::-webkit-details-marker]:hidden"
      >
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand"
        >
          {initials}
        </span>
        <span className="hidden max-w-40 truncate text-sm font-medium md:block">
          {displayName}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="hidden text-muted md:block"
          size={16}
          strokeWidth={1.75}
        />
      </summary>
      <div className="absolute right-0 top-12 z-[var(--sng-z-dropdown)] w-72 rounded-md border border-border-subtle bg-surface p-4 shadow-md">
        <p className="truncate text-sm font-semibold text-foreground">
          {displayName}
        </p>
        <p className="mt-1 break-all text-xs text-muted">{email}</p>
        <Separator className="my-4" />
        <Button
          type="button"
          variant="ghost"
          onClick={onSignOut}
          className="w-full justify-start text-danger hover:bg-danger-soft hover:text-danger"
        >
          <LogOut aria-hidden="true" size={17} strokeWidth={1.75} />
          Cerrar sesión
        </Button>
      </div>
    </details>
  );
}
