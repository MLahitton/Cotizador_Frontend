import { CircleAlert, CircleCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { ClientListItem } from "@/features/clients/clients-types";
import { cn } from "@/lib/utils/cn";

export function CreateClientError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-sm border border-danger bg-danger-soft p-4 text-danger"
    >
      <CircleAlert
        aria-hidden="true"
        className="mt-0.5 shrink-0"
        size={20}
        strokeWidth={1.75}
      />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function CreateClientSuccess({
  createdClient,
  onCreateAnother,
}: {
  createdClient: ClientListItem;
  onCreateAnother: () => void;
}) {
  return (
    <Surface className="max-w-3xl">
      <div className="flex items-start gap-4">
        <CircleCheck
          aria-hidden="true"
          className="mt-1 shrink-0 text-success"
          size={24}
          strokeWidth={1.75}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-foreground">
            Cliente creado correctamente
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-secondary">
            El cliente fue registrado y ya está disponible en la plataforma.
          </p>

          <div className="mt-6 border-t border-border-subtle pt-5">
            <p className="text-base font-semibold text-foreground">
              {createdClient.legalName}
            </p>
            {createdClient.tradeName ? (
              <p className="mt-1 text-sm text-foreground-secondary">
                {createdClient.tradeName}
              </p>
            ) : null}
            <Badge tone="success" size="sm" className="mt-3">
              Activo
            </Badge>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/clients"
              className={cn(
                buttonVariants({ variant: "primary" }),
                "w-full sm:w-auto",
              )}
            >
              Volver al listado
            </Link>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onCreateAnother}
            >
              Crear otro cliente
            </Button>
          </div>
        </div>
      </div>
    </Surface>
  );
}
