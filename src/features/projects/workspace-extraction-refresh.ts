import type { ProjectWorkspace } from "./project-workspace-types";

export function mergeWorkflowRefresh(current: ProjectWorkspace, response: ProjectWorkspace): ProjectWorkspace {
  if (JSON.stringify(current.workflow) === JSON.stringify(response.workflow)) return current;
  return { ...current, workflow: response.workflow };
}

// A bounded sequence of reads. No retry writes, overlapping reads or inferred business states.
export function createExtractionRefresh(options: {
  read: (signal: AbortSignal) => Promise<ProjectWorkspace>;
  current: () => boolean;
  apply: (workspace: ProjectWorkspace) => void;
  notice: (message: string | null) => void;
  busy?: (request: symbol, value: boolean) => void;
  initialRefresh?: boolean;
  schedule: (callback: () => void, delay: number) => () => void;
  limit?: number;
}) {
  const controller = new AbortController();
  let cancelTimer: (() => void) | undefined;
  let count = 0;
  let disposed = false;
  let inFlight = false;
  let busyRequest: symbol | undefined;
  const finishBusy = (request: symbol | undefined) => {
    if (request !== undefined && busyRequest === request) {
      busyRequest = undefined;
      options.busy?.(request, false);
    }
  };
  const active = () => !disposed && !controller.signal.aborted && options.current();
  const later = () => { if (active()) cancelTimer = options.schedule(() => { void poll(); }, 7000); };
  const poll = async (explicit = false) => {
    if (!active() || inFlight) return;
    cancelTimer?.(); cancelTimer = undefined;
    inFlight = true;
    const request = explicit ? Symbol("workspace-read") : undefined;
    if (request !== undefined) {
      count = 0; busyRequest = request; options.busy?.(request, true);
    }
    try {
      const workspace = await options.read(controller.signal);
      if (!active()) return;
      options.apply(workspace);
      if (explicit) options.notice(null);
      if (!workspace.workflow.extraction?.refreshRecommended) return;
      if (++count >= (options.limit ?? 20)) {
        options.notice("La consulta automática se ha pausado. Consulta de nuevo para conocer el estado actualizado.");
        return;
      }
      later();
    } catch {
      if (active()) options.notice("No se pudo actualizar el estado. Se conserva la última información consultada.");
    } finally {
      inFlight = false;
      finishBusy(request);
    }
  };
  if (options.initialRefresh !== false) later();
  return Object.assign(() => {
    disposed = true; cancelTimer?.();
    // Retire this request before abort; its eventual settlement owns no newer load.
    finishBusy(busyRequest);
    controller.abort();
  }, {
    consult: () => poll(true),
  });
}
