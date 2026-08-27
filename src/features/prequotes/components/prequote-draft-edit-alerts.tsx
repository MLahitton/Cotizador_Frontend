import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export type DraftEditBlockingNotice = "version-conflict" | "already-approved" | null;

export function DraftEditNotice({
  notice,
  onContinue,
  onDiscardAndReload,
}: {
  notice: DraftEditBlockingNotice;
  onContinue: () => void;
  onDiscardAndReload: () => void;
}) {
  if (!notice) return null;

  const copy =
    notice === "already-approved"
      ? {
          title: "El borrador fue aprobado por otra sesión.",
          body: "Tus cambios locales siguen aquí, pero el borrador aprobado ya no puede modificarse.",
        }
      : {
          title: "El borrador fue modificado por otra sesión.",
          body: "Tus cambios locales siguen aquí. Puedes seguir revisándolos o descartarlos para cargar la versión actual.",
        };

  return (
    <div
      role="alert"
      className="rounded-sm border border-warning bg-warning-soft p-4 text-warning"
    >
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{copy.title}</p>
          <p className="mt-2 text-sm leading-6">{copy.body}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onContinue}
        >
          Seguir revisando mis cambios
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onDiscardAndReload}
        >
          Descartar mis cambios y cargar versión actual
        </Button>
      </div>
    </div>
  );
}

export function DraftValidationAlert({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      role="alert"
      className="rounded-sm border border-danger bg-danger-soft p-4 text-sm font-medium text-danger"
    >
      Revisa los campos marcados antes de guardar.
    </div>
  );
}

export function DraftSubmitErrorAlert({
  message,
  visible,
}: {
  message: string | null;
  visible: boolean;
}) {
  if (!visible || !message) return null;
  return (
    <div
      role="alert"
      className="rounded-sm border border-danger bg-danger-soft p-4 text-sm font-medium text-danger"
    >
      {message}
    </div>
  );
}
