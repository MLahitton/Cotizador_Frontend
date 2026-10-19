"use client";

import { FileSearch, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { useProjectRequirementAnalysis } from "../use-project-requirement-analysis";

export function ProjectRequirementAnalysisState({ analysis, onRefresh }: {
  analysis: ReturnType<typeof useProjectRequirementAnalysis>;
  onRefresh: () => void;
}) {
  const { status, error, readOnly, isSubmitting, process } = analysis;
  const processing = status === "PROCESSING";
  const canStart = !readOnly && (status === "PENDING" || status === "FAILED");
  const title = processing ? (isSubmitting ? "Analizando documentos..." : "Análisis en curso")
    : status === "PENDING" ? (readOnly ? "Análisis pendiente" : "Documentos recibidos")
    : status === "FAILED" ? "No fue posible completar el análisis"
    : status === "CANCELLED" ? "Análisis cancelado"
    : status === "SUPERSEDED" ? "Análisis reemplazado"
    : "No fue posible cargar la configuración del proyecto.";
  const description = processing
    ? "Estamos identificando los elementos del proyecto. El análisis puede tardar varios minutos según la cantidad y complejidad de los documentos."
    : status === "PENDING"
    ? "Los documentos del proyecto están listos para ser analizados. Inicia el análisis para identificar los elementos de ventanería y continuar con la configuración."
    : status === "FAILED"
    ? "Puedes intentarlo nuevamente. Los documentos del proyecto se conservan y no necesitas volver a cargarlos."
    : status === "CANCELLED" ? "Este análisis fue cancelado y no puede iniciarse desde aquí."
    : status === "SUPERSEDED" ? "Este análisis fue reemplazado por una versión más reciente."
    : "Actualiza el estado para consultar la información disponible.";
  const Icon = processing ? LoaderCircle : FileSearch;

  return (
    <section className="min-w-0 space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Configuración de espacios</h2>
      <Surface className="space-y-5" aria-busy={processing}>
        <div className="flex items-start gap-4" role="status" aria-live="polite">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Icon aria-hidden="true" className={`size-6 ${processing ? "motion-safe:animate-spin" : ""}`} />
          </span>
          <div className="min-w-0 space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="max-w-2xl text-sm leading-relaxed text-foreground-secondary">{description}</p>
          </div>
        </div>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        {canStart ? (
          <Button type="button" onClick={process} disabled={isSubmitting}>
            <FileSearch className="size-4" aria-hidden="true" />
            {status === "FAILED" ? "Reintentar análisis" : "Analizar documentos"}
          </Button>
        ) : null}
        {status === "PROCESSED" || !status ? (
          <Button type="button" variant="outline" onClick={onRefresh}>
            <RefreshCw className="size-4" aria-hidden="true" />Actualizar estado
          </Button>
        ) : null}
      </Surface>
    </section>
  );
}
