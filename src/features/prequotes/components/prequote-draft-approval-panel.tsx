"use client";

import { CheckCircle, CircleAlert, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import {
  formatEconomicCompleteness,
  formatPreQuoteDraftNumber,
} from "@/features/prequotes/prequote-draft-formatters";
import type { PreQuoteDraftDetails } from "@/features/prequotes/prequote-draft-types";
import {
  getApprovePreQuoteDraftErrorMessage,
  useApprovePreQuoteDraft,
} from "@/features/prequotes/use-approve-prequote-draft";

type ApprovalNotice = "version-conflict" | "already-approved" | null;

function getApprovalBlockers(draft: PreQuoteDraftDetails): string[] {
  const blockers: string[] = [];
  const summary = draft.summary;
  const economicSummary = draft.economicSummary;

  if (summary) {
    if (summary.pendingIssueCount > 0) {
      blockers.push(
        `${formatPreQuoteDraftNumber(summary.pendingIssueCount)} issues pendientes`,
      );
    }

    if (summary.pendingConflictCount > 0) {
      blockers.push(
        `${formatPreQuoteDraftNumber(summary.pendingConflictCount)} conflictos pendientes`,
      );
    }

    if (summary.itemsRequiringCompletion > 0) {
      blockers.push(
        `${formatPreQuoteDraftNumber(summary.itemsRequiringCompletion)} ítems requieren completar datos`,
      );
    }
  }

  if (economicSummary.includedItemCount === 0) {
    blockers.push("No hay ítems incluidos para aprobar");
  }

  if (!economicSummary.isEconomicallyComplete) {
    blockers.push("La valoración económica está incompleta");
  }

  if (economicSummary.pendingValuationItemCount > 0) {
    blockers.push(
      `${formatPreQuoteDraftNumber(economicSummary.pendingValuationItemCount)} valoraciones pendientes`,
    );
  }

  if (economicSummary.staleValuationItemCount > 0) {
    blockers.push(
      `${formatPreQuoteDraftNumber(economicSummary.staleValuationItemCount)} valoraciones desactualizadas`,
    );
  }

  if (economicSummary.notPriceableItemCount > 0) {
    blockers.push(
      `${formatPreQuoteDraftNumber(economicSummary.notPriceableItemCount)} ítems no cotizables`,
    );
  }

  if (economicSummary.itemsRequiringReviewCount > 0) {
    blockers.push(
      `${formatPreQuoteDraftNumber(economicSummary.itemsRequiringReviewCount)} ítems requieren revisión`,
    );
  }

  return blockers;
}

function ApprovalStatusList({
  draft,
  blockers,
}: {
  draft: PreQuoteDraftDetails;
  blockers: string[];
}) {
  const summary = draft.summary;
  const economicSummary = draft.economicSummary;
  const readyItems = [
    {
      label: summary ? "Sin issues pendientes" : "Issues: sin resumen disponible",
      status: summary ? "success" : "unknown",
    },
    {
      label: summary
        ? "Sin conflictos pendientes"
        : "Conflicts: sin resumen disponible",
      status: summary ? "success" : "unknown",
    },
    summary
      ? {
          label: "Ítems incluidos completos",
          status: "success",
        }
      : {
          label: "Completitud de ítems: sin resumen disponible",
          status: "unknown",
        },
    {
      label: formatEconomicCompleteness(economicSummary.isEconomicallyComplete),
      status: "success",
    },
  ];

  return blockers.length > 0 ? (
    <ul className="mt-3 grid gap-2 text-sm leading-6 text-foreground-secondary">
      {blockers.map((blocker) => (
        <li key={blocker} className="flex min-w-0 items-start gap-2">
          <CircleAlert
            aria-hidden="true"
            size={16}
            strokeWidth={1.75}
            className="mt-1 shrink-0 text-warning"
          />
          <span className="min-w-0 break-words">{blocker}</span>
        </li>
      ))}
    </ul>
  ) : (
    <ul className="mt-3 grid gap-2 text-sm leading-6 text-foreground-secondary sm:grid-cols-2">
      {readyItems.map((item) => (
        <li key={item.label} className="flex min-w-0 items-start gap-2">
          {item.status === "success" ? (
            <CheckCircle
              aria-hidden="true"
              size={16}
              strokeWidth={1.75}
              className="mt-1 shrink-0 text-success"
            />
          ) : (
            <CircleAlert
              aria-hidden="true"
              size={16}
              strokeWidth={1.75}
              className="mt-1 shrink-0 text-foreground-secondary"
            />
          )}
          <span className="min-w-0 break-words">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

function ApprovalNoticeAlert({
  notice,
  onReload,
}: {
  notice: ApprovalNotice;
  onReload: () => void;
}) {
  if (!notice) return null;

  const copy =
    notice === "already-approved"
      ? {
          title: "El borrador ya fue aprobado.",
          body: "Carga la versión actual para ver el estado autoritativo en solo lectura.",
        }
      : {
          title: "El borrador cambió en otra sesión.",
          body: "Recarga la información autoritativa antes de intentar aprobar nuevamente.",
        };

  return (
    <div
      role="alert"
      className="rounded-sm border border-warning bg-warning-soft p-4 text-warning"
    >
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">{copy.title}</p>
          <p className="mt-2 text-sm leading-6">{copy.body}</p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-4 w-full sm:w-auto"
        onClick={onReload}
      >
        Cargar versión actual
      </Button>
    </div>
  );
}

export function PreQuoteDraftApprovalPanel({
  draft,
  preQuoteId,
  onApproved,
  onReloadDraft,
}: {
  draft: PreQuoteDraftDetails;
  preQuoteId: string;
  onApproved: (draft: PreQuoteDraftDetails) => void;
  onReloadDraft: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [notice, setNotice] = useState<ApprovalNotice>(null);
  const approveDraft = useApprovePreQuoteDraft();
  const blockers = getApprovalBlockers(draft);
  const isApproved = draft.status === "APPROVED";
  const isBlocked = blockers.length > 0;
  const errorMessage = approveDraft.error
    ? getApprovePreQuoteDraftErrorMessage(approveDraft.error.cause)
    : null;

  const openConfirmation = () => {
    setNotice(null);
    approveDraft.resetError();
    setIsConfirming(true);
  };

  const cancelConfirmation = () => {
    setIsConfirming(false);
    approveDraft.resetError();
  };

  const confirmApproval = async () => {
    setNotice(null);
    approveDraft.resetError();

    const result = await approveDraft.approve(preQuoteId, {
      expectedVersion: draft.version,
    });

    if (result.status === "approved") {
      setIsConfirming(false);
      onApproved(result.draft);
      return;
    }

    if (result.status === "version-conflict") {
      setIsConfirming(false);
      setNotice("version-conflict");
      return;
    }

    if (result.status === "already-approved") {
      setIsConfirming(false);
      setNotice("already-approved");
    }
  };

  if (isApproved) {
    return (
      <Surface>
        <div className="flex min-w-0 items-start gap-3">
          <CheckCircle
            aria-hidden="true"
            size={20}
            strokeWidth={1.75}
            className="mt-0.5 shrink-0 text-success"
          />
          <div className="min-w-0">
            <Badge tone="success" size="sm">
              Aprobado
            </Badge>
            <h2 className="mt-3 text-lg font-semibold text-foreground">
              Precotización aprobada
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              El borrador quedó en solo lectura. La información mostrada proviene
              de la respuesta autoritativa del servidor.
            </p>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface>
      <section
        aria-labelledby="draft-approval-title"
        aria-busy={approveDraft.isApproving ? "true" : undefined}
        className="min-w-0 space-y-4"
      >
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge tone={isBlocked ? "warning" : "success"} size="sm">
              {isBlocked ? "No puede aprobarse todavía" : "Listo para revisión final"}
            </Badge>
            <h2
              id="draft-approval-title"
              className="mt-3 text-lg font-semibold text-foreground"
            >
              Estado para aprobación
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-secondary">
              Backend hará la validación definitiva al aprobar. Estas señales
              solo orientan la revisión actual del borrador.
            </p>
            <ApprovalStatusList draft={draft} blockers={blockers} />
          </div>
          <Button
            type="button"
            variant="primary"
            className="w-full lg:w-auto"
            disabled={approveDraft.isApproving || isBlocked || isConfirming}
            onClick={openConfirmation}
          >
            <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.75} />
            Aprobar precotización
          </Button>
        </div>

        <ApprovalNoticeAlert notice={notice} onReload={onReloadDraft} />

        {errorMessage ? (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-sm border border-danger bg-danger-soft p-4 text-sm font-medium leading-6 text-danger"
          >
            {errorMessage}
          </div>
        ) : null}

        {isConfirming ? (
          <div
            aria-labelledby="draft-approval-confirmation-title"
            aria-describedby="draft-approval-confirmation-description"
            aria-busy={approveDraft.isApproving ? "true" : undefined}
            className="rounded-sm border border-border-subtle bg-surface-subtle p-4"
          >
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
              <div className="min-w-0">
                <h3
                  id="draft-approval-confirmation-title"
                  className="text-sm font-semibold text-foreground"
                >
                  Confirmar aprobación
                </h3>
                <p
                  id="draft-approval-confirmation-description"
                  className="mt-2 text-sm leading-6 text-foreground-secondary"
                >
                  Se aprobará la precotización y el borrador quedará en solo
                  lectura. Revisa la información antes de continuar.
                </p>
              </div>
              <div className="flex min-w-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  disabled={approveDraft.isApproving}
                  onClick={cancelConfirmation}
                >
                  <X aria-hidden="true" size={16} strokeWidth={1.75} />
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={approveDraft.isApproving}
                  onClick={confirmApproval}
                >
                  <ShieldCheck aria-hidden="true" size={16} strokeWidth={1.75} />
                  {approveDraft.isApproving ? "Aprobando..." : "Confirmar aprobación"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </Surface>
  );
}
