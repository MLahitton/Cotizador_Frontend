import { CircleAlert, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function PreQuotesLoading({ message }: { message: string }) {
  return (
    <Surface>
      <div
        className="flex items-center gap-3 text-sm text-foreground-secondary"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <LoaderCircle aria-hidden="true" size={18} strokeWidth={1.75} />
        <p>{message}</p>
      </div>
    </Surface>
  );
}

export function PreQuotesError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <Surface>
      <div role="alert" className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-danger"
          size={20}
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            {message}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={onRetry}
          >
            Reintentar
          </Button>
        </div>
      </div>
    </Surface>
  );
}

export function InvalidIdentifierFeedback({
  message,
}: {
  message: string;
}) {
  return (
    <Surface>
      <div role="alert" className="flex items-start gap-3">
        <CircleAlert
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-danger"
          size={20}
          strokeWidth={1.75}
        />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">{message}</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            Revisa el enlace utilizado para abrir esta página.
          </p>
        </div>
      </div>
    </Surface>
  );
}
