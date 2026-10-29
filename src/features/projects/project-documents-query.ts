import type { RequirementDetails } from "@/features/prequotes/requirement-types";
import type { ProjectWorkspace } from "./project-workspace-types";
import { ApiError } from "@/lib/http/api-error";

export type ProjectDocumentsContext =
  | { status: "empty" | "ambiguous" | "unavailable" }
  | { status: "resolved"; projectId: string; requirementId: string; preQuoteId: string };

export type ProjectDocumentsState =
  | { status: "loading" | "empty" | "ambiguous" | "unavailable" }
  | { status: "success"; details: RequirementDetails }
  | { status: "error"; cause: unknown };

export function resolveProjectDocumentsContext(workspace: ProjectWorkspace): ProjectDocumentsContext {
  const { workflow } = workspace;
  if (workflow.resolutionState === "EMPTY") return { status: "empty" };
  if (workflow.resolutionState === "AMBIGUOUS") return { status: "ambiguous" };
  if (!workflow.requirementId?.trim() || !workflow.preQuoteId?.trim()) return { status: "unavailable" };
  return {
    status: "resolved", projectId: workspace.project.id,
    requirementId: workflow.requirementId, preQuoteId: workflow.preQuoteId,
  };
}

function sameId(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

// Logical cancellation matches the existing workspace queries; the client has no AbortSignal option.
export function createProjectDocumentsQuery(
  context: Extract<ProjectDocumentsContext, { status: "resolved" }>,
  load: (id: string) => Promise<RequirementDetails>,
  onChange: (state: ProjectDocumentsState) => void,
) {
  let request = 0;
  let disposed = false;
  return {
    async load() {
      if (disposed) return;
      const current = ++request;
      onChange({ status: "loading" });
      try {
        const details = await load(context.requirementId);
        if (disposed || current !== request) return;
        if (!sameId(details.requirementId, context.requirementId) || !sameId(details.preQuoteId, context.preQuoteId)) {
          throw new ApiError({ status: 0, title: "Respuesta inválida", detail: "El conjunto documental no corresponde al contexto consultado." });
        }
        onChange({ status: "success", details });
      } catch (cause) {
        if (!disposed && current === request) onChange({ status: "error", cause });
      }
    },
    dispose() { disposed = true; request++; },
  };
}

export function projectDocumentsErrorMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    if (cause.status === 401) return "Tu sesión expiró. Inicia sesión nuevamente.";
    if (cause.status === 403) return "No tienes acceso para consultar estos documentos.";
    if (cause.status === 404) return "Los documentos no están disponibles.";
  }
  return "No fue posible consultar los documentos. Puedes volver a cargarlos.";
}
