"use client";

import { useEffect, useMemo, useState } from "react";

import { Surface } from "@/components/ui/surface";

const MESSAGES = [
  "Preparando la información del requerimiento…",
  "Interpretando puertas, ventanas y elementos…",
  "Revisando dimensiones y configuraciones…",
  "Contrastando sistemas compatibles de Steel & Glass…",
  "Revisando vidrio y acabado solicitados…",
  "Buscando referencias históricas comparables…",
  "Organizando la propuesta técnica…",
  "Validando elementos que puedan requerir revisión…",
  "Seguimos trabajando. Los documentos complejos pueden tomar algunos minutos.",
];

function progressAt(seconds: number): number {
  const points = [[0, 8], [5, 18], [15, 30], [30, 45], [60, 58], [90, 68], [120, 78], [150, 85], [180, 92]];
  for (let index = 1; index < points.length; index += 1) {
    const [endTime, endValue] = points[index];
    if (seconds <= endTime) {
      const [startTime, startValue] = points[index - 1];
      return Math.round(startValue + ((seconds - startTime) / (endTime - startTime)) * (endValue - startValue));
    }
  }
  return 92;
}

export function RequirementAnalysisProgress({ completed = false }: { completed?: boolean }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    if (completed) return;
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [completed]);
  const progress = completed ? 100 : progressAt(elapsedSeconds);
  const message = useMemo(
    () => MESSAGES[Math.min(Math.floor(elapsedSeconds / 12), MESSAGES.length - 1)],
    [elapsedSeconds],
  );
  return (
    <Surface variant="elevated" padding="lg">
      <h3 className="text-lg font-semibold text-foreground">
        {completed ? "Análisis completado" : "Analizando tu requerimiento"}
      </h3>
      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progreso estimado del análisis"
      >
        <div className="h-full rounded-full bg-brand motion-safe:transition-[width] motion-safe:duration-1000" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-3 text-sm font-medium text-foreground" role="status" aria-live="polite">
        {completed ? "Preparando la propuesta técnica…" : message}
      </p>
      <p className="mt-2 text-sm text-foreground-secondary">
        El avance es estimado. El análisis puede tomar entre 2 y 4 minutos.
      </p>
    </Surface>
  );
}
