"use client";

import { ArrowLeft, Pencil, Save, X } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import {
  formatDateTime,
  formatProjectStatus,
} from "@/features/projects/project-detail-formatters";
import { formatPreQuoteDateTime } from "@/features/prequotes/prequote-formatters";
import { updatePreQuoteName } from "@/features/prequotes/prequotes-api";
import type {
  PreQuoteDetails,
  ProjectContext,
} from "@/features/prequotes/prequotes-types";
import { cn } from "@/lib/utils/cn";

const PREQUOTE_NAME_MAX_LENGTH = 160;

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </dd>
    </div>
  );
}

function PreQuoteNameEditor({
  preQuote,
  onSaved,
}: {
  preQuote: PreQuoteDetails;
  onSaved: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(preQuote.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length > PREQUOTE_NAME_MAX_LENGTH) {
      setError("El nombre no puede superar 160 caracteres.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updatePreQuoteName(
        preQuote.id,
        trimmedName === "" ? null : trimmedName,
      );
      setIsEditing(false);
      onSaved();
    } catch {
      setError("No fue posible guardar el nombre de la precotizacion.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="min-w-0 md:col-span-2 xl:col-span-3">
        <dt className="text-xs font-semibold uppercase text-foreground-secondary">
          Nombre
        </dt>
        <dd className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="break-words text-sm font-medium text-foreground">
            {preQuote.name ?? "Sin nombre asignado"}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setName(preQuote.name ?? "");
              setError(null);
              setIsEditing(true);
            }}
          >
            <Pencil aria-hidden="true" size={15} strokeWidth={1.75} />
            Editar nombre
          </Button>
        </dd>
      </div>
    );
  }

  return (
    <div className="min-w-0 md:col-span-2 xl:col-span-3">
      <dt className="text-xs font-semibold uppercase text-foreground-secondary">
        Nombre
      </dt>
      <dd className="mt-2">
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input
            value={name}
            maxLength={PREQUOTE_NAME_MAX_LENGTH}
            disabled={isSaving}
            aria-invalid={Boolean(error)}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre visible de la precotizacion"
          />
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" size="sm" disabled={isSaving}>
              <Save aria-hidden="true" size={15} strokeWidth={1.75} />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
            >
              <X aria-hidden="true" size={15} strokeWidth={1.75} />
              Cancelar
            </Button>
          </div>
        </form>
      </dd>
    </div>
  );
}

export function PreQuoteDetailHeader({
  project,
  preQuote,
}: {
  project: ProjectContext;
  preQuote?: PreQuoteDetails | null;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/projects/${encodeURIComponent(project.id)}/prequotes`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-start px-0 sm:w-auto",
            )}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver a precotizaciones
          </Link>
          <Link
            href={`/projects/${encodeURIComponent(project.id)}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-full justify-start px-0 sm:w-auto",
            )}
          >
            <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
            Volver al proyecto
          </Link>
        </div>
        <Badge tone="brand">Precotizaciones</Badge>
        <h1 className="mt-4 break-words text-2xl font-semibold text-foreground sm:text-3xl">
          {preQuote ? preQuote.serial : "Detalle de precotizacion"}
        </h1>
        {preQuote?.name ? (
          <p className="mt-2 break-words text-base text-foreground-secondary">
            {preQuote.name}
          </p>
        ) : null}
      </div>
    </header>
  );
}

export function PreQuoteDetailView({
  project,
  preQuote,
  onNameUpdated,
}: {
  project: ProjectContext;
  preQuote: PreQuoteDetails;
  onNameUpdated: () => void;
}) {
  return (
    <div className="min-w-0 space-y-6">
      <Surface padding="none" className="min-w-0 overflow-hidden">
        <section className="p-5 sm:p-6" aria-labelledby="prequote-project-title">
          <h2
            id="prequote-project-title"
            className="text-lg font-semibold text-foreground"
          >
            Proyecto
          </h2>
          <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <DetailField label="Codigo" value={project.code} />
            <DetailField label="Nombre" value={project.name} />
            <DetailField
              label="Estado"
              value={formatProjectStatus(project.isActive)}
            />
            <DetailField
              label="Ultima actualizacion"
              value={formatDateTime(project.updatedAtUtc)}
            />
          </dl>
        </section>
      </Surface>

      <Surface padding="none" className="min-w-0 overflow-hidden">
        <section className="p-5 sm:p-6" aria-labelledby="prequote-detail-title">
          <h2
            id="prequote-detail-title"
            className="text-lg font-semibold text-foreground"
          >
            Informacion disponible
          </h2>
          <dl className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <DetailField label="Serial" value={preQuote.serial} />
            <PreQuoteNameEditor preQuote={preQuote} onSaved={onNameUpdated} />
            <DetailField label="ID interno" value={preQuote.id} />
            <DetailField label="Proyecto" value={preQuote.projectId} />
            <DetailField
              label="Fecha de creacion"
              value={formatPreQuoteDateTime(preQuote.createdAtUtc)}
            />
            <DetailField
              label="Ultima actualizacion"
              value={formatPreQuoteDateTime(preQuote.updatedAtUtc)}
            />
          </dl>
        </section>
      </Surface>
    </div>
  );
}