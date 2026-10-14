"use client";

import { Loader2, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RequirementExperienceLevel2CandidateState } from "@/features/prequotes/prequote-experience-types";
import { cn } from "@/lib/utils/cn";

export interface ExperienceLevel2DialogOption {
  id: string;
  title: string;
  code: string;
  description: string | null;
  compatibilityState: RequirementExperienceLevel2CandidateState;
  isSuggested: boolean;
  isCurrent: boolean;
}

interface ExperienceLevel2SelectionDialogProps {
  open: boolean;
  title: string;
  subtitle: string;
  options: ExperienceLevel2DialogOption[];
  saving: boolean;
  submittingOptionId: string | null;
  onClose: () => void;
  onSelect: (id: string) => void;
}

function stateLabel(state: RequirementExperienceLevel2CandidateState): string {
  if (state === "REQUIRES_REVIEW") return "Requiere revision tecnica";
  if (state === "INCOMPATIBLE") return "No disponible";
  return "Compatible";
}

function stateTone(state: RequirementExperienceLevel2CandidateState): "neutral" | "warning" | "danger" | "success" {
  if (state === "REQUIRES_REVIEW") return "warning";
  if (state === "INCOMPATIBLE") return "danger";
  return "success";
}

function sortOptions(options: ExperienceLevel2DialogOption[]): ExperienceLevel2DialogOption[] {
  const rank = (option: ExperienceLevel2DialogOption): number => {
    if (option.isSuggested && option.compatibilityState !== "INCOMPATIBLE") return 0;
    if (option.compatibilityState === "COMPATIBLE") return 1;
    if (option.compatibilityState === "REQUIRES_REVIEW") return 2;
    return 3;
  };

  return options
    .filter((option) => option.compatibilityState !== "INCOMPATIBLE")
    .map((option, index) => ({ option, index }))
    .sort((a, b) => rank(a.option) - rank(b.option) || a.index - b.index)
    .map(({ option }) => option);
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ExperienceLevel2SelectionDialog({
  open,
  title,
  subtitle,
  options,
  saving,
  submittingOptionId,
  onClose,
  onSelect,
}: ExperienceLevel2SelectionDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const orderedOptions = useMemo(() => sortOptions(options), [options]);

  useEffect(() => {
    if (!open) return;
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    return () => {
      if (returnFocusRef.current && document.contains(returnFocusRef.current)) {
        returnFocusRef.current.focus();
      }
      returnFocusRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, saving]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/35 px-3 py-4 sm:items-center sm:px-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="experience-level2-dialog-title" className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-md border border-border bg-surface shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-4 py-4 sm:px-5">
          <div>
            <h2 id="experience-level2-dialog-title" className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-foreground-secondary">{subtitle}</p>
          </div>
          <button ref={closeButtonRef} type="button" disabled={saving} aria-label="Cerrar selector" className="rounded-sm p-2 text-foreground-secondary transition hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8D9DB7]/55 disabled:cursor-not-allowed disabled:opacity-50" onClick={onClose}>
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <div className="max-h-[64vh] overflow-y-auto p-4 sm:p-5">
          {orderedOptions.length === 0 ? (
            <p className="rounded-md border border-border-subtle bg-surface-subtle p-4 text-sm text-foreground-secondary">No hay alternativas disponibles para esta configuracion.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {orderedOptions.map((option) => (
                <article key={option.id} className={cn("rounded-md border bg-surface p-4 transition", option.isCurrent ? "border-[#8D9DB7] shadow-sm shadow-[#8D9DB7]/20" : "border-border-subtle hover:border-[#8D9DB7]/65")}>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{option.title}</h3>
                      <p className="mt-0.5 text-xs font-semibold text-foreground-secondary">{option.code}</p>
                    </div>
                    {option.isSuggested ? <Badge tone="brand" size="sm">Recomendado</Badge> : null}
                  </div>
                  {option.description ? <p className="mt-3 text-sm leading-5 text-foreground-secondary">{option.description}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <Badge tone={stateTone(option.compatibilityState)} size="sm">{stateLabel(option.compatibilityState)}</Badge>
                    <Button type="button" size="sm" variant={option.isCurrent ? "outline" : "primary"} disabled={saving || option.isCurrent} aria-busy={saving && submittingOptionId === option.id} onClick={() => onSelect(option.id)}>
                      {saving && submittingOptionId === option.id ? <Loader2 aria-hidden="true" size={14} className="animate-spin" /> : null}
                      {saving && submittingOptionId === option.id ? "Guardando" : option.isCurrent ? "Seleccion actual" : "Seleccionar"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
