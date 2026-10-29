"use client";

import { useEffect, useState } from "react";
import { ImageIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { getAccessToken } from "@/features/auth/auth-storage";
import { createProjectIdeaPhotoQuery, type ProjectIdeaPhotoState } from "../project-idea-photo-query";

const referenceImage = "/images/project-reference.webp";

export function ProjectIdeaPhotoView({ state, onRetry, onImageError, onReferenceError }: {
  state: ProjectIdeaPhotoState;
  onRetry: () => void;
  onImageError: (url: string) => void;
  onReferenceError: () => void;
}) {
  const image = state.status === "photo" ? state.url : state.status === "reference" ? referenceImage : null;
  const caption = state.status === "photo" ? "Imagen compartida por el cliente" : "Imagen de referencia";
  return (
    <figure aria-label="Imagen del proyecto" className={`flex w-full min-w-0 flex-col bg-surface-subtle ${state.status === "reference" ? "" : "h-[260px] md:h-[340px] lg:h-[400px] min-[1440px]:h-[440px]"}`}>
      {image ? <>
        <div className={state.status === "reference" ? "w-full" : "relative isolate min-h-0 flex-1 overflow-hidden"}>
          {state.status === "photo" ? <div aria-hidden="true" className="pointer-events-none absolute -inset-12">
            {/* Decorative overscan keeps the blur edges outside the clipped image area. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" aria-hidden="true" className="h-full w-full max-w-none object-cover opacity-60 blur-xl" />
          </div> : null}
          {/* Original authenticated bytes and static reference must never pass through an image proxy. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img key={image} src={image} alt={state.status === "photo" ? "Fotografía del proyecto compartida por el cliente" : "Imagen de referencia"}
            width={state.status === "reference" ? 1600 : undefined} height={state.status === "reference" ? 793 : undefined}
            className={state.status === "reference" ? "block h-auto w-full" : "relative z-10 h-full w-full object-contain [image-orientation:from-image]"}
            onError={() => state.status === "photo" ? onImageError(state.url) : onReferenceError()} />
        </div>
        <figcaption className="shrink-0 px-3 py-2 text-center text-xs text-foreground-secondary">{caption}</figcaption>
      </> : <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-foreground-secondary" role="status" aria-live="polite">
        <ImageIcon aria-hidden="true" size={26} />
        {state.status === "loading" ? <p aria-busy="true">Cargando imagen…</p> : null}
        {state.status === "authentication" ? <p>Inicia sesión para consultar la imagen.</p> : null}
        {state.status === "unavailable" ? <p>Imagen no disponible para este proyecto.</p> : null}
        {state.status === "reference-error" ? <p>Imagen de referencia no disponible.</p> : null}
        {state.status === "error" ? <>
          <p>No pudimos cargar la imagen.</p>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}><RefreshCw aria-hidden="true" size={16} />Volver a cargar</Button>
        </> : null}
      </div>}
    </figure>
  );
}

export function ProjectIdeaPhoto({ projectId }: { projectId: string }) {
  const { user, isInitializing } = useAuth();
  const token = getAccessToken();
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{ projectId: string; user: typeof user; token: string | null; revision: number;
    owner: ReturnType<typeof createProjectIdeaPhotoQuery>; state: ProjectIdeaPhotoState } | null>(null);
  useEffect(() => {
    if (!user || !token || isInitializing) return;
    const current = createProjectIdeaPhotoQuery(projectId, (state) => setResult({ projectId, user, token, revision, owner: current, state }));
    queueMicrotask(() => { void current.load(); });
    return () => current.dispose();
  }, [projectId, user, token, revision, isInitializing]);
  // Identity is checked during render too: never paint an old photo while effect cleanup is pending.
  const state: ProjectIdeaPhotoState = isInitializing ? { status: "loading" }
    : !user || !token ? { status: "authentication" }
    : result?.projectId === projectId && result.user === user && result.token === token && result.revision === revision
      ? result.state : { status: "loading" };
  return <ProjectIdeaPhotoView state={state} onRetry={() => setRevision((n) => n + 1)}
    onImageError={(url) => result?.owner.imageFailed(url)} onReferenceError={() => result?.owner.referenceFailed()} />;
}
