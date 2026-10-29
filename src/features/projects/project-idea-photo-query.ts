import { ApiError } from "@/lib/http/api-error";
import { apiGetImage } from "@/lib/http/api-client";

export type ProjectIdeaPhotoState =
  | { status: "loading" | "reference" | "reference-error" | "authentication" | "unavailable" | "error" }
  | { status: "photo"; url: string };

export function getProjectIdeaPhoto(projectId: string, signal: AbortSignal) {
  return apiGetImage(`/api/v2/projects/${encodeURIComponent(projectId)}/idea-photo`, signal);
}

// One mounted consumer owns its request and object URL. Nothing enters a shared cache.
export function createProjectIdeaPhotoQuery(
  projectId: string,
  changed: (state: ProjectIdeaPhotoState) => void,
  read = getProjectIdeaPhoto,
  urls = { create: (blob: Blob) => URL.createObjectURL(blob), revoke: (url: string) => URL.revokeObjectURL(url) },
) {
  let disposed = false;
  let generation = 0;
  let request: AbortController | null = null;
  let activeUrl: string | null = null;
  let reference = false;
  const release = () => { if (activeUrl) urls.revoke(activeUrl); activeUrl = null; };
  return {
    async load() {
      if (disposed) return;
      const current = ++generation;
      request?.abort();
      const controller = new AbortController();
      request = controller;
      reference = false;
      changed({ status: "loading" });
      release();
      try {
        const blob = await read(projectId, controller.signal);
        if (disposed || current !== generation || controller.signal.aborted) return;
        if (blob === null) { reference = true; changed({ status: "reference" }); return; }
        activeUrl = urls.create(blob);
        changed({ status: "photo", url: activeUrl });
      } catch (cause) {
        if (disposed || current !== generation || controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        const status = cause instanceof ApiError ? cause.status : 0;
        changed({ status: status === 401 ? "authentication" : status === 403 || status === 404 ? "unavailable" : "error" });
      }
    },
    imageFailed(url: string) {
      if (disposed || activeUrl !== url) return;
      changed({ status: "error" });
      release();
    },
    referenceFailed() { if (!disposed && reference) { reference = false; changed({ status: "reference-error" }); } },
    dispose() { disposed = true; generation++; request?.abort(); release(); },
  };
}
