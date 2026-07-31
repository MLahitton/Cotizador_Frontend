import { CircleAlert, FilePlus2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getCreatePreQuoteErrorMessage } from "@/features/prequotes/components/prequote-errors";
import type { CreatePreQuoteError } from "@/features/prequotes/prequotes-types";

export function CreatePreQuoteConfirmation({
  projectCode,
  projectName,
  isSubmitting,
  error,
  onConfirm,
  onCancel,
}: {
  projectCode: string;
  projectName: string;
  isSubmitting: boolean;
  error: CreatePreQuoteError | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const errorMessage = error
    ? getCreatePreQuoteErrorMessage(error.cause)
    : null;

  return (
    <Surface
      variant="subtle"
      className="max-w-3xl"
      aria-labelledby="create-prequote-confirmation-title"
      aria-describedby="create-prequote-confirmation-description"
      aria-busy={isSubmitting ? "true" : undefined}
    >
      <section>
        <div className="flex min-w-0 items-start gap-3">
          <FilePlus2
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-brand"
            size={20}
            strokeWidth={1.75}
          />
          <div className="min-w-0">
            <h2
              id="create-prequote-confirmation-title"
              className="text-lg font-semibold text-foreground"
            >
              Crear nueva precotización
            </h2>
            <p
              id="create-prequote-confirmation-description"
              className="mt-2 text-sm leading-6 text-foreground-secondary"
            >
              Se creará una precotización vacía para este proyecto. Después
              podrás agregar los documentos necesarios.
            </p>
            <dl className="mt-4 grid gap-2 text-sm">
              <div className="min-w-0">
                <dt className="font-medium text-foreground-secondary">
                  Código
                </dt>
                <dd className="break-words font-semibold text-foreground">
                  {projectCode}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-medium text-foreground-secondary">
                  Proyecto
                </dt>
                <dd className="break-words font-semibold text-foreground">
                  {projectName}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 flex items-start gap-3 rounded-sm border border-danger bg-danger-soft p-4 text-danger"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={20}
              strokeWidth={1.75}
            />
            <p className="min-w-0 text-sm font-semibold leading-6">
              {errorMessage}
            </p>
          </div>
        ) : null}

        <div
          className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"
          aria-live="polite"
        >
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
            onClick={onConfirm}
          >
            {isSubmitting ? "Creando..." : "Crear precotización"}
          </Button>
        </div>
      </section>
    </Surface>
  );
}
