"use client";

import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { getAccessToken } from "@/features/auth/auth-storage";
import { ApiError } from "@/lib/http/api-error";
import { createDocumentDownload } from "../project-document-download";

export function ProjectDocumentDownloadButton({ requirementId, fileId, fileName }: { requirementId: string; fileId: string; fileName: string }) {
  const { user } = useAuth();
  const token = getAccessToken();
  if (!user || !token) return null;
  return <DownloadButton key={`${user.id}:${token}:${requirementId}:${fileId}`} requirementId={requirementId} fileId={fileId} fileName={fileName} />;
}

function DownloadButton({ requirementId, fileId, fileName }: { requirementId: string; fileId: string; fileName: string }) {
  const [state, setState] = useState<{ kind: "idle" | "busy" | "error"; message?: string }>({ kind: "idle" });
  const download = useRef<ReturnType<typeof createDocumentDownload> | null>(null);
  useEffect(() => {
    const current = createDocumentDownload(requirementId, fileId, fileName, (kind, error) => {
      const status = error instanceof ApiError ? error.status : 0;
      setState({ kind, message: status === 401 ? "Inicia sesión nuevamente." : status === 403 || status === 404
        ? "Documento no disponible para esta solicitud." : "No fue posible descargar. Puedes volver a intentarlo." });
    });
    download.current = current;
    return () => { current.dispose(); if (download.current === current) download.current = null; };
  }, [requirementId, fileId, fileName]);
  return <div className="min-w-0 space-y-1">
    <Button type="button" variant="outline" size="sm" disabled={state.kind === "busy"} onClick={() => void download.current?.start()}>
      {state.kind === "busy" ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin" /> : <Download size={16} aria-hidden="true" />}
      {state.kind === "busy" ? "Descargando…" : "Descargar"}
    </Button>
    {state.kind === "error" ? <p role="alert" className="max-w-64 break-words text-xs text-danger">{state.message}</p> : null}
  </div>;
}
