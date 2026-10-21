"use client";

import { CalendarDays, ClipboardList, Info, Palette, RefreshCw, Shield, Sun, TriangleAlert, Volume2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DiagnosisScaleIndicator } from "./diagnosis-scale-indicator";
import { Button } from "@/components/ui/button";
import { diagnosisSections, type DiagnosisSection, type DiagnosisStatus, type ProjectDiagnosisEntry } from "../project-diagnosis-types";
import { useProjectDiagnosis, type DiagnosisLoadState } from "../use-project-diagnosis";

const sectionTitles: Record<DiagnosisSection, string> = {
  general: "Información general",
  priorities: "Prioridades del cliente",
  preferences: "Preferencias",
  livingContext: "Contexto de vivienda",
  needs: "Necesidades",
  decision: "Decisión y tiempos",
  supplementalNotes: "Información adicional",
};
const statusMessages: Record<Exclude<DiagnosisStatus, "AVAILABLE">, string> = {
  NO_PUBLIC_EXPERIENCE: "Este proyecto no tiene un diagnóstico de experiencia disponible.",
  AMBIGUOUS_PUBLIC_EXPERIENCE: "No fue posible determinar un único diagnóstico para este proyecto.",
  UNSUPPORTED_SCHEMA: "Este diagnóstico proviene de una versión de Experience que todavía no puede interpretarse en esta pantalla.",
  INVALID_SOURCE_DATA: "No fue posible interpretar la información original del proyecto.",
};

function AnswerValue({ entry }: { entry: ProjectDiagnosisEntry }) {
  if (entry.availability === "NOT_PROVIDED") return <span className="font-medium text-foreground-secondary">Sin información</span>;
  if (entry.availability === "UNKNOWN_CODE") return <span className="text-foreground-secondary">Valor no reconocido</span>;
  if (entry.availability === "INVALID_VALUE") return <span className="inline-flex items-start gap-1.5 font-medium text-foreground-secondary"><TriangleAlert size={16} aria-hidden="true" className="mt-0.5 shrink-0" />Información no válida</span>;
  if (["termico", "acustico", "seguridad", "estetica", "funcionalidad"].includes(entry.questionId)
    && entry.numericValue !== null && Number.isInteger(entry.numericValue)
    && entry.numericValue >= 1 && entry.numericValue <= 5) {
    return <DiagnosisScaleIndicator value={entry.numericValue} label={entry.displayLabel} displayValue={entry.displayValue ?? undefined} />;
  }
  if (entry.displayValues?.length) {
    return <ul className="flex min-w-0 flex-wrap gap-1.5">
      {entry.displayValues.map((label, index) => <li key={index} className="max-w-full rounded-sm border border-border-subtle bg-surface-subtle px-2 py-1 text-sm [overflow-wrap:anywhere]">{label}</li>)}
    </ul>;
  }
  return <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">{entry.displayValue}</span>;
}

const priorityIcons: Record<string, LucideIcon> = {
  termico: Sun, acustico: Volume2, seguridad: Shield, estetica: Palette, uv: Sun,
};

function DiagnosisDataCard({ entry, priority }: { entry: ProjectDiagnosisEntry; priority: boolean }) {
  const Icon = priority ? priorityIcons[entry.questionId] : undefined;
  const timing = entry.questionId === "tiempo" || entry.questionId === "ventana_ejecucion";
  const longText = entry.availability === "AVAILABLE" && entry.textValue !== null
    && (entry.textValue.length > 160 || entry.textValue.includes("\n"));

  return <div className={cn(
    "min-w-0 rounded-md border border-border-subtle bg-surface p-4",
    longText && "col-span-full",
    priority && "border-accent/30",
    timing && "border-l-2 border-l-accent",
  )}>
    <dt className={cn("flex items-start gap-2 text-sm text-foreground-secondary [overflow-wrap:anywhere]", priority && "mb-3")}>
      {Icon && <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"><Icon size={16} aria-hidden="true" /></span>}
      {timing && <CalendarDays size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />}
      <span className={priority ? "self-center" : undefined}>{entry.displayLabel}</span>
    </dt>
    <dd className="mt-1 min-w-0 text-base font-semibold leading-snug text-foreground"><AnswerValue entry={entry} /></dd>
  </div>;
}

export function ProjectDiagnosisView({ state, onRetry }: { state: DiagnosisLoadState; onRetry: () => void }) {
  const response = state.status === "success" ? state.data : null;
  const diagnosis = response?.diagnosis;
  const sections = diagnosis ? diagnosisSections.filter((key) =>
    diagnosis[key].some((entry) => entry.availability !== "NOT_APPLICABLE")) : [];
  const warning = response && response.status !== "AVAILABLE" && response.status !== "NO_PUBLIC_EXPERIENCE";
  const StatusIcon = warning ? TriangleAlert : Info;

  return <section aria-labelledby="project-diagnosis-title" className="min-w-0 space-y-6">
    <header className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent"><ClipboardList size={20} aria-hidden="true" /></span>
      <div className="min-w-0">
        <h2 id="project-diagnosis-title" className="text-xl font-semibold text-foreground">Diagnóstico del proyecto</h2>
        <p className="mt-1 text-sm text-foreground-secondary">Resumen de la información compartida por el cliente durante la experiencia inicial.</p>
      </div>
    </header>

    {state.status === "loading" && <p role="status" className="py-8 text-sm text-foreground-secondary">Cargando diagnóstico...</p>}
    {state.status === "error" && <div role="alert" className="space-y-3 border-t border-border-subtle py-6">
      <p className="text-sm text-foreground">No fue posible cargar el diagnóstico.</p>
      <Button type="button" variant="outline" onClick={onRetry} className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><RefreshCw size={16} aria-hidden="true" />Reintentar</Button>
    </div>}
    {response && response.status !== "AVAILABLE" && <div role="status" className="flex items-start gap-3 border-t border-border-subtle py-6">
      <StatusIcon size={20} aria-hidden="true" className={warning ? "shrink-0 text-warning" : "shrink-0 text-accent"} />
      <div className="min-w-0 space-y-2 text-sm">
        <p className="font-medium text-foreground">{statusMessages[response.status]}</p>
        {response.status === "NO_PUBLIC_EXPERIENCE" && <p className="text-foreground-secondary">El diagnóstico se genera a partir de la información compartida por el cliente en la experiencia digital.</p>}
      </div>
    </div>}
    {diagnosis && <>
      {sections.length === 0 ? <p className="py-6 text-sm text-foreground-secondary">Sin información</p> :
        <div className="@container">
          <div className="space-y-6">
            {sections.map((key) => <section key={key} aria-labelledby={`diagnosis-${key}`} className="min-w-0">
              <h3 id={`diagnosis-${key}`} className="mb-3 text-base font-semibold text-foreground">{sectionTitles[key]}</h3>
              <dl className={cn(
                "grid min-w-0 grid-cols-1 gap-3 @min-[500px]:grid-cols-2",
                key === "priorities"
                  ? "@min-[760px]:grid-cols-3 @min-[1020px]:grid-cols-5"
                  : key === "general" || key === "decision" || key === "preferences"
                    ? "@min-[820px]:grid-cols-3" : "",
              )}>
                {diagnosis[key].filter((entry) => entry.availability !== "NOT_APPLICABLE").map((entry) =>
                  <DiagnosisDataCard key={entry.questionId} entry={entry} priority={key === "priorities"} />)}
              </dl>
            </section>)}
          </div>
        </div>}
      <p className="border-t border-border-subtle pt-4 text-xs text-foreground-secondary">Información recibida desde la experiencia digital.</p>
    </>}
  </section>;
}

export function ProjectDiagnosisStep({ projectId }: { projectId: string }) {
  const { state, retry } = useProjectDiagnosis(projectId);
  return <ProjectDiagnosisView state={state} onRetry={retry} />;
}
