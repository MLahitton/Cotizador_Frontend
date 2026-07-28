"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ClientForm } from "@/features/clients/components/client-form";
import {
  CreateClientError,
  CreateClientSuccess,
} from "@/features/clients/components/create-client-feedback";
import { useCreateClient } from "@/features/clients/use-create-client";
import { cn } from "@/lib/utils/cn";

export function CreateClientPageContent() {
  const {
    values,
    errors,
    isSubmitting,
    submitError,
    createdClient,
    setFieldValue,
    submit,
    reset,
  } = useCreateClient();

  return (
    <div className="space-y-6">
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone="brand">Gestión comercial</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Nuevo cliente
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Registra la información necesaria para identificar y contactar al
            cliente.
          </p>
        </div>
        <Link
          href="/clients"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full shrink-0 sm:w-auto",
          )}
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Volver a clientes
        </Link>
      </header>

      {createdClient ? (
        <CreateClientSuccess
          createdClient={createdClient}
          onCreateAnother={reset}
        />
      ) : (
        <div className="space-y-4">
          {submitError ? <CreateClientError message={submitError} /> : null}
          <ClientForm
            values={values}
            errors={errors}
            isSubmitting={isSubmitting}
            onFieldChange={setFieldValue}
            onSubmit={submit}
            cancelHref="/clients"
          />
        </div>
      )}
    </div>
  );
}
