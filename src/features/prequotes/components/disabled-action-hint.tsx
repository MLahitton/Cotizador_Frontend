"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function DisabledActionHint({
  message,
  position = "top",
  children,
}: {
  message: string | null;
  position?: "top" | "bottom";
  children: ReactNode;
}) {
  if (!message) return <>{children}</>;
  const id = `disabled-hint-${message.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 48)}`;

  return (
    <span className="group relative inline-flex w-full sm:w-auto" tabIndex={0} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-40 w-64 -translate-x-1/2 rounded-sm border border-border bg-foreground px-3 py-2 text-center text-xs font-medium leading-5 text-background opacity-0 shadow-lg transition group-hover:opacity-100 group-focus:opacity-100",
          position === "top" ? "bottom-[calc(100%+0.5rem)]" : "top-[calc(100%+0.5rem)]",
        )}
      >
        {message}
      </span>
    </span>
  );
}