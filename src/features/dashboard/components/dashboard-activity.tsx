import Link from "next/link";
import {
  Activity,
  FileText,
  FolderKanban,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Surface } from "@/components/ui/surface";
import type {
  UserDashboardActivityItem,
} from "@/features/dashboard/dashboard-types";

export interface DashboardActivityProps {
  items: UserDashboardActivityItem[];
  isLoading: boolean;
}

function ActivityIcon({
  type,
}: {
  type: UserDashboardActivityItem["type"];
}) {
  if (type === "PROJECT_UPDATED") {
    return (
      <FolderKanban
        aria-hidden="true"
        size={18}
        strokeWidth={1.75}
      />
    );
  }

  if (type === "PREQUOTE_UPDATED") {
    return (
      <FileText
        aria-hidden="true"
        size={18}
        strokeWidth={1.75}
      />
    );
  }

  if (type === "REQUIREMENT_PROCESSING") {
    return (
      <LoaderCircle
        aria-hidden="true"
        size={18}
        strokeWidth={1.75}
      />
    );
  }

  if (
    type === "PROPOSAL_CREATED" ||
    type === "REQUIREMENT_PROCESSED"
  ) {
    return (
      <Sparkles
        aria-hidden="true"
        size={18}
        strokeWidth={1.75}
      />
    );
  }

  return (
    <Activity
      aria-hidden="true"
      size={18}
      strokeWidth={1.75}
    />
  );
}

function formatActivityDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(date);
}

function getHref(
  item: UserDashboardActivityItem,
): string {
  if (item.preQuoteId) {
    return `/projects/${item.projectId}/prequotes/${item.preQuoteId}`;
  }

  return `/projects/${item.projectId}`;
}

export function DashboardActivity({
  items,
  isLoading,
}: DashboardActivityProps) {
  return (
    <section aria-labelledby="dashboard-activity-title">
      <Surface
        padding="none"
        className="min-w-0 overflow-hidden"
      >
        <div className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0">
            <h2
              id="dashboard-activity-title"
              className="text-lg font-semibold text-foreground"
            >
              Actividad reciente
            </h2>

            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Últimos cambios registrados en tus proyectos y precotizaciones.
            </p>
          </div>

          {!isLoading ? (
            <Badge tone="neutral" size="sm">
              {items.length > 0
                ? `${items.length} recientes`
                : "Sin actividad"}
            </Badge>
          ) : null}
        </div>

        <Separator />

        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-muted sm:px-6">
            Actualizando actividad...
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center sm:px-6 sm:py-12">
            <Activity
              aria-hidden="true"
              className="mx-auto text-muted"
              size={28}
              strokeWidth={1.5}
            />

            <p className="mt-4 text-sm font-semibold text-foreground">
              No hay actividad disponible
            </p>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-foreground-secondary">
              Las actualizaciones de proyectos, requerimientos y propuestas
              aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {items.map((item, index) => (
              <Link
                key={`${item.type}-${item.projectId}-${item.preQuoteId ?? "project"}-${item.occurredAtUtc}-${index}`}
                href={getHref(item)}
                className="flex min-w-0 items-start gap-4 p-4 transition-colors hover:bg-surface-subtle sm:p-6"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-soft text-brand">
                  <ActivityIcon type={item.type} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {item.title}
                      </p>

                      <p className="mt-1 text-sm text-foreground-secondary">
                        {item.projectCode} · {item.projectName}
                      </p>

                      {item.preQuoteSerial ? (
                        <p className="mt-1 text-xs text-muted">
                          {item.preQuoteSerial}
                          {item.preQuoteName
                            ? ` · ${item.preQuoteName}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    <time
                      dateTime={item.occurredAtUtc}
                      className="shrink-0 text-xs text-muted"
                    >
                      {formatActivityDate(
                        item.occurredAtUtc,
                      )}
                    </time>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-foreground-secondary">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Surface>
    </section>
  );
}