import type { CurrentRequirement, RequirementDetails, RequirementLifecycleResponse } from "@/features/prequotes/requirement-types";
import { validateRequirementDocumentFiles } from "@/features/prequotes/requirement-document-validation";
import { ApiError } from "@/lib/http/api-error";
import type { ProjectDocumentsContext } from "./project-documents-query";

export type DocumentOperation = "add" | "substitute" | "remove" | "replacement";
export type DocumentMutationState = {
  kind: "idle" | "busy" | "success" | "validation" | "conflict" | "rejected" | "uncertain" | "replaced";
  message: string;
  needsRead: boolean;
  consulting?: boolean;
  cause?: unknown;
};
export const idleDocumentMutation: DocumentMutationState = { kind: "idle", message: "", needsRead: false };
type Context = Extract<ProjectDocumentsContext, { status: "resolved" }>;
export type DocumentMutationApi = {
  add: (id: string, file: File) => Promise<RequirementLifecycleResponse>;
  substitute: (id: string, documentId: string, file: File) => Promise<RequirementLifecycleResponse>;
  remove: (id: string, documentId: string) => Promise<RequirementLifecycleResponse>;
  replacement: (id: string, files: File[]) => Promise<RequirementLifecycleResponse>;
};

export function canMutateDocuments(details: RequirementDetails | null, readOnly: boolean, operation: DocumentOperation): boolean {
  if (!details || readOnly || !details.isCurrent) return false;
  if (operation === "replacement") return details.canReplace === true;
  if (details.canEditDocuments !== true) return false;
  return operation !== "remove" || details.documents.length > 1;
}

function matches(left: string, right: string) { return left.toLowerCase() === right.toLowerCase(); }

export function documentMutationFailure(cause: unknown): DocumentMutationState {
  const error = cause instanceof ApiError ? cause : null;
  const code = error?.problemDetails?.errorCode ?? error?.problemDetails?.code;
  if (code === "REQUIREMENT_NOT_MUTABLE" || code === "REQUIREMENT_NOT_REPLACEABLE") {
    return { kind: "conflict", needsRead: true, cause, message: "El estado de esta versión documental cambió. Estamos consultando las acciones disponibles." };
  }
  if (!error || error.status === 0 || error.status >= 500) {
    return { kind: "uncertain", needsRead: true, cause, message: "No pudimos confirmar el resultado. La lista muestra el último estado confirmado. Consulta el estado antes de realizar otra acción; no repetiremos el envío automáticamente." };
  }
  const validation: Record<number, string> = {
    400: "No se pudo completar la acción. Revisa los archivos y la selección.",
    413: "Los archivos superan los límites permitidos.",
    415: "Uno de los archivos tiene un formato no compatible.",
    422: "Uno de los archivos está vacío o no se puede utilizar.",
  };
  if (validation[error.status]) return { kind: "validation", needsRead: false, cause, message: validation[error.status] };
  const messages: Record<number, string> = {
    401: "Tu sesión expiró. Inicia sesión nuevamente.",
    403: "No tienes permiso para realizar esta acción.",
    404: "El documento o la versión documental ya no está disponible.",
    409: "La acción no está disponible en el estado actual. Consulta el estado antes de continuar.",
  };
  return { kind: "rejected", needsRead: true, cause, message: messages[error.status] ?? "No se pudo completar la acción. Consulta el estado antes de continuar." };
}

export function createDocumentMutationSession(context: Context, api: DocumentMutationApi, onChange: (state: DocumentMutationState) => void) {
  let busy = false;
  let reading = false;
  let disposed = false;
  let replaced = false;
  let needsRead = false;
  let beforeRead: RequirementDetails | null = null;
  let state = idleDocumentMutation;
  const publish = (next: DocumentMutationState) => { state = next; needsRead = next.needsRead; if (!disposed) onChange(next); };
  const validContext = (details: RequirementDetails) => matches(details.requirementId, context.requirementId) && matches(details.preQuoteId, context.preQuoteId);
  return {
    async consultIdentity(load: (preQuoteId: string) => Promise<CurrentRequirement | null>, onSame: () => void, onChanged: () => void) {
      if (disposed || busy || reading || replaced || !needsRead) return;
      reading = true;
      publish({ ...state, consulting: true });
      try {
        const current = await load(context.preQuoteId);
        if (disposed) return;
        if (current && !matches(current.preQuoteId, context.preQuoteId)) throw new Error("Unexpected consultation identity");
        if (!current || !matches(current.requirementId, context.requirementId)) onChanged(); else onSame();
      } catch (cause) {
        if (!disposed) publish({ ...state, needsRead: true, cause, message: "No fue posible consultar el estado. Vuelve a consultarlo antes de continuar." });
      } finally {
        reading = false;
        if (!disposed) publish({ ...state, consulting: false });
      }
    },
    acknowledgeRead(details: RequirementDetails) {
      if (disposed || busy || replaced || !needsRead || details === beforeRead || !validContext(details)) return;
      publish({ ...state, needsRead: false, message: state.kind === "success" ? "Cambios documentales guardados." : "Estado consultado. Revisa las acciones disponibles antes de continuar." });
    },
    async submit({ operation, details, readOnly, files, documentId, onSuccess, onReplacement, onRefresh }: {
      operation: DocumentOperation; details: RequirementDetails | null; readOnly: boolean; files: File[]; documentId: string;
      onSuccess: (response: RequirementLifecycleResponse) => void;
      onReplacement: (response: RequirementLifecycleResponse) => void;
      onRefresh: () => void;
    }): Promise<boolean> {
      if (disposed || busy || reading || replaced || needsRead || !details || !validContext(details) || !canMutateDocuments(details, readOnly, operation)) return false;
      if ((operation === "substitute" || operation === "remove") && !details.documents.some((doc) => doc.requirementFileId === documentId)) {
        publish({ kind: "validation", needsRead: false, message: "Selecciona el documento sobre el que quieres actuar." });
        return false;
      }
      const issue = operation === "remove" ? null : validateRequirementDocumentFiles(files)
        ?? (operation !== "replacement" && files.length !== 1 ? "Selecciona un solo archivo para esta acción." : null);
      if (issue) { publish({ kind: "validation", needsRead: false, message: issue }); return false; }
      busy = true;
      beforeRead = details;
      publish({ kind: "busy", message: "Guardando cambios documentales…", needsRead: false });
      let response: RequirementLifecycleResponse;
      try {
        response = operation === "add" ? await api.add(context.requirementId, files[0])
          : operation === "substitute" ? await api.substitute(context.requirementId, documentId, files[0])
          : operation === "remove" ? await api.remove(context.requirementId, documentId)
          : await api.replacement(context.requirementId, files);
        if (disposed) return false;
        const identityValid = matches(response.preQuoteId, context.preQuoteId) && (operation === "replacement"
          ? !matches(response.requirementId, context.requirementId) && response.isCurrent &&
            typeof response.supersedesRequirementId === "string" && matches(response.supersedesRequirementId, context.requirementId)
          : matches(response.requirementId, context.requirementId));
        if (!identityValid) throw new Error("Unexpected document mutation identity");
      } catch (cause) {
        if (disposed) return false;
        const failure = documentMutationFailure(cause);
        publish(failure);
        if (failure.kind === "conflict") onRefresh();
        return false;
      } finally { busy = false; }
      if (operation === "replacement") {
        replaced = true;
        publish({ kind: "replaced", message: "Nueva versión creada. Actualizando los documentos del proyecto…", needsRead: false });
        onReplacement(response);
      } else {
        publish({ kind: "success", message: "Cambios documentales guardados.", needsRead: true });
        onSuccess(response);
      }
      return true;
    },
    dispose() { disposed = true; },
  };
}
