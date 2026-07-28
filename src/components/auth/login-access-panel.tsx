import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

import { Surface } from "@/components/ui/surface";

export interface LoginAccessPanelProps {
  children: ReactNode;
  error: string | null;
  notice: string | null;
}

export function LoginAccessPanel({
  children,
  error,
  notice,
}: LoginAccessPanelProps) {
  return (
    <section
      aria-labelledby="login-access-title"
      className="flex items-center justify-center bg-background px-4 py-10 sm:px-8 sm:py-14 lg:min-h-screen lg:px-12"
    >
      <div className="w-full max-w-lg">
        <h2
          id="login-access-title"
          className="mb-7 text-center font-['URW_Gothic','Century_Gothic',sans-serif] text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          <span className="text-[#8F9CB8]">steel</span>{" "}
          <span className="text-[#1B213C]">and</span>{" "}
          <span className="text-[#8F9CB8]">glass</span>
        </h2>
        <Surface variant="elevated" padding="lg" className="w-full">
          <h3 className="text-2xl font-semibold text-foreground">Bienvenido</h3>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Inicia sesión con tu cuenta corporativa para continuar.
          </p>

          <div className="mt-7">{children}</div>

          {error ? (
            <div
              className="mt-5 flex items-start gap-3 rounded-sm border border-danger bg-danger-soft p-3 text-sm text-danger"
              role="alert"
              aria-live="assertive"
            >
              <CircleAlert
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={18}
                strokeWidth={1.75}
              />
              <p>{error}</p>
            </div>
          ) : null}

          {notice ? (
            <div
              className="mt-5 flex items-start gap-3 rounded-sm border border-warning bg-warning-soft p-3 text-sm text-warning"
              role="status"
              aria-live="polite"
            >
              <Info
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={18}
                strokeWidth={1.75}
              />
              <p>{notice}</p>
            </div>
          ) : null}

          <p className="mt-6 text-center text-sm leading-6 text-muted">
            Utiliza la cuenta de Google autorizada por Steel and Glass.
          </p>
        </Surface>
      </div>
    </section>
  );
}
