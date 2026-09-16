import Link from "next/link";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";
import type {
  UserDashboard,
  UserDashboardAttentionItem,
} from "@/features/dashboard/dashboard-types";

export interface DashboardProcessOverviewProps {
  dashboard: UserDashboard | null;
  isLoading: boolean;
}

function AttentionIcon({
  type,
}: {
  type: UserDashboardAttentionItem["type"];
}) {
  if (type === "REQUIREMENT_PROCESSING") {
    return (
      <LoaderCircle
        aria-hidden="true"
        size={19}
        strokeWidth={1.75}
      />
    );
  }

  return (
    <CircleAlert
      aria-hidden="true"
      size={19}
      strokeWidth={1.75}
    />
  );
}

export function DashboardProcessOverview({
  dashboard,
  isLoading,
}: DashboardProcessOverviewProps) {
  const attentionItems =
    dashboard?.attentionItems ?? [];

  const proposalsRequiringReview =
    dashboard?.proposalsRequiringReview ?? 0;

  const requirementsInProgress =
    dashboard?.requirementsInProgress ?? 0;

  const hasPendingAttention =
    proposalsRequiringReview > 0 ||
    requirementsInProgress > 0;

  return (
    <section aria-labelledby="attention-title">
      <Surface
        padding="none"
        className="min-w-0 overflow-hidden"
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <h2
              id="attention-title"
              className="text-lg font-semibold text-foreground"
            >
              Necesita tu atención
            </h2>

            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Revisa los procesos que todavía tienen trabajo pendiente.
            </p>
          </div>

          {!isLoading ? (
            <Badge
              tone={
                proposalsRequiringReview > 0
                  ? "warning"
                  : "neutral"
              }
              size="sm"
            >
              {proposalsRequiringReview > 0
                ? `${proposalsRequiringReview} por revisar`
                : "Sin revisiones pendientes"}
            </Badge>
          ) : null}
        </div>

        <Separator />

        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-muted sm:px-6">
            Actualizando pendientes...
          </div>
        ) : attentionItems.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-6 sm:py-12">
            <CircleCheck
              aria-hidden="true"
              className="mx-auto text-muted"
              size={30}
              strokeWidth={1.5}
            />

            <p className="mt-4 text-sm font-semibold text-foreground">
              Todo está al día
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground-secondary">
              No tienes procesos que requieran atención en este momento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {attentionItems.map((item) => (
              <Link
                key={`${item.type}-${item.requirementId}`}
                href={`/projects/${item.projectId}/prequotes/${item.preQuoteId}`}
                className="flex min-w-0 items-start gap-4 p-4 transition-colors hover:bg-surface-subtle sm:p-6"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                  <AttentionIcon type={item.type} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {item.projectCode} · {item.projectName}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {item.preQuoteSerial}
                        {item.preQuoteName
                          ? ` · ${item.preQuoteName}`
                          : ""}
                      </p>
                    </div>

                    <Badge
                      tone={
                        item.type === "PROPOSAL_REVIEW"
                          ? "warning"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {item.type === "PROPOSAL_REVIEW"
                        ? "Por revisar"
                        : "En análisis"}
                    </Badge>
                  </div>

                  <p className="mt-3 text-sm font-medium text-foreground">
                    {item.title}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-foreground-secondary">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && hasPendingAttention ? (
          <>
            <Separator />

            <div className="flex justify-end px-4 py-3 sm:px-6">
              <Link
                href="/projects?attention=pending"
                className="inline-flex items-center gap-2 text-sm font-medium text-brand transition-opacity hover:opacity-75"
              >
                Ver todos los pendientes
                <ArrowRight
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.75}
                />
              </Link>
            </div>
          </>
        ) : null}
      </Surface>
    </section>
  );
}