import { GlobalSearch } from "@/components/layout/global-search";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { UserAccount } from "@/components/layout/user-account";

export interface AppHeaderProps {
  displayName: string;
  email: string;
  initials: string;
  onSignOut: () => void;
}

export function AppHeader({
  displayName,
  email,
  initials,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-[var(--sng-z-sticky)] flex h-[var(--sng-header-height)] min-w-0 items-center gap-3 border-b border-border-subtle bg-surface px-[var(--sng-content-gutter-mobile)] md:gap-5 md:px-[var(--sng-content-gutter-tablet)] lg:px-[var(--sng-content-gutter-desktop)]">
      <MobileNavigation />
      <GlobalSearch />
      <UserAccount
        displayName={displayName}
        email={email}
        initials={initials}
        onSignOut={onSignOut}
      />
    </header>
  );
}
