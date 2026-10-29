import Link from "next/link";
import { FileSearch } from "lucide-react";
import type { WorkspaceExtraction } from "../project-workspace-types";

export const extractionCopy: Record<WorkspaceExtraction["state"], [string, string]> = {
  Manual: ["", ""],
  Waiting: ["En espera de análisis", "Los documentos están pendientes de admisión para su análisis inicial."],
  Admitted: ["En espera de análisis", "La admisión está registrada, pero el inicio aún no se ha confirmado. Esta lectura no permite confirmar su continuidad."],
  Running: ["Analizando documentos", "El inicio del análisis está registrado. Este estado no confirma que el proceso siga activo en este instante."],
  CancellationRequested: ["Cancelación solicitada", "La solicitud está registrada; todavía no hay una cancelación confirmada."],
  Succeeded: ["Resultados disponibles", "El análisis de esta versión documental tiene una propuesta disponible."],
  Failed: ["No se pudo completar el análisis", "El análisis terminó sin resultados disponibles. Revisa los documentos del proyecto."],
  Cancelled: ["Análisis cancelado", "La cancelación está confirmada. No se iniciará otra ejecución desde esta vista."],
  ContinuityUnknown: ["No se puede confirmar la continuidad del análisis", "Las condiciones registradas no permiten confirmar su continuidad. No se ha inferido un fallo ni una cancelación."],
  Inconsistent: ["No se puede confirmar la continuidad del análisis", "No se pudo relacionar de forma inequívoca esta versión con su ejecución y resultados."],
};

export function ProjectExtractionStatus({ extraction, projectId, configuration = false }: {
  extraction?: WorkspaceExtraction | null; projectId: string; configuration?: boolean;
}) {
  if (!extraction || extraction.state === "Manual") return null;
  const [title, detail] = extractionCopy[extraction.state];
  return <section role="status" aria-live="polite" className="min-w-0 space-y-2 border-l-2 border-brand py-2 pl-4">
    <h3 className="flex items-start gap-2 text-base font-semibold text-foreground"><FileSearch aria-hidden="true" size={18} className="mt-0.5 shrink-0" />{title}</h3>
    <p className="text-sm leading-6 text-foreground-secondary">{detail}</p>
    {configuration && ["Failed", "Cancelled", "ContinuityUnknown", "Inconsistent"].includes(extraction.state)
      ? <Link className="text-sm font-medium text-brand underline" href={`/projects/${encodeURIComponent(projectId)}?section=documents`}>Ver documentos</Link> : null}
  </section>;
}
