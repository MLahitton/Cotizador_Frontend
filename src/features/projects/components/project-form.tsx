"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  type FormEvent,
} from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import type { ClientListItem } from "@/features/clients/clients-types";
import {
  ProjectClientSelector,
  type ProjectClientSelectorHandle,
} from "@/features/projects/components/project-client-selector";
import type {
  ProjectFormErrors,
  ProjectFormValues,
} from "@/features/projects/projects-types";
import { cn } from "@/lib/utils/cn";

interface FieldErrorProps {
  id: string;
  message?: string;
}

export interface ProjectFormProps {
  mode: "create";
  values: ProjectFormValues;
  selectedClient: ClientListItem | null;
  errors: ProjectFormErrors;
  isSubmitting: boolean;
  serverError: string | null;
  clientSearchResetKey: number;
  onFieldChange: (field: keyof ProjectFormValues, value: string) => void;
  onClientSelect: (client: ClientListItem) => void;
  onClientClear: () => void;
  onCodeBlur: () => void;
  onSubmit: () => void;
  cancelHref: string;
}

function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function ProjectForm({
  values,
  selectedClient,
  errors,
  isSubmitting,
  serverError,
  clientSearchResetKey,
  onFieldChange,
  onClientSelect,
  onClientClear,
  onCodeBlur,
  onSubmit,
  cancelHref,
}: ProjectFormProps) {
  const clientSelectorRef = useRef<ProjectClientSelectorHandle>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const lastErrorFocusKeyRef = useRef<string | undefined>(undefined);
  const disabled = isSubmitting;

  useEffect(() => {
    const errorFocusKey = [
      errors.form,
      errors.client,
      errors.code,
      errors.name,
      errors.location,
      errors.description,
    ].join("|");

    if (!errors.form || errorFocusKey === lastErrorFocusKeyRef.current) {
      return;
    }

    lastErrorFocusKeyRef.current = errorFocusKey;

    if (errors.client) {
      clientSelectorRef.current?.focusSearch();
      return;
    }

    if (errors.code) {
      codeRef.current?.focus();
      return;
    }

    if (errors.name) {
      nameRef.current?.focus();
      return;
    }

    if (errors.location) {
      locationRef.current?.focus();
      return;
    }

    if (errors.description) {
      descriptionRef.current?.focus();
    }
  }, [errors]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Surface padding="none" className="min-w-0 max-w-5xl overflow-visible">
        {serverError ? (
          <div
            role="alert"
            className="border-b border-danger bg-danger-soft px-5 py-4 text-sm font-medium text-danger sm:px-6"
          >
            {serverError}
          </div>
        ) : null}

        {errors.form ? (
          <div
            role="alert"
            className="border-b border-danger bg-danger-soft px-5 py-4 text-sm font-medium text-danger sm:px-6"
          >
            {errors.form}
          </div>
        ) : null}

        <section
          aria-labelledby="project-main-title"
          className="border-b border-border-subtle p-5 sm:p-6"
        >
          <div>
            <h2
              id="project-main-title"
              className="text-lg font-semibold text-foreground"
            >
              Información del proyecto
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Selecciona el cliente activo y define los datos principales del
              proyecto.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <ProjectClientSelector
                ref={clientSelectorRef}
                selectedClient={selectedClient}
                error={errors.client}
                disabled={disabled}
                resetKey={clientSearchResetKey}
                onClientSelect={onClientSelect}
                onClientClear={onClientClear}
              />
            </div>

            <div>
              <label
                htmlFor="project-code"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Código
              </label>
              <Input
                ref={codeRef}
                id="project-code"
                name="code"
                value={values.code}
                onChange={(event) => onFieldChange("code", event.target.value)}
                onBlur={onCodeBlur}
                placeholder="PRY-001"
                maxLength={30}
                required
                disabled={disabled}
                aria-invalid={errors.code ? true : undefined}
                aria-describedby={errors.code ? "project-code-error" : undefined}
              />
              <FieldError id="project-code-error" message={errors.code} />
            </div>

            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Nombre
              </label>
              <Input
                ref={nameRef}
                id="project-name"
                name="name"
                value={values.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="Fachada principal"
                maxLength={200}
                required
                disabled={disabled}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "project-name-error" : undefined}
              />
              <FieldError id="project-name-error" message={errors.name} />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="project-location"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Ubicación
              </label>
              <Input
                ref={locationRef}
                id="project-location"
                name="location"
                value={values.location}
                onChange={(event) =>
                  onFieldChange("location", event.target.value)
                }
                placeholder="Bucaramanga"
                maxLength={250}
                disabled={disabled}
                aria-invalid={errors.location ? true : undefined}
                aria-describedby={
                  errors.location ? "project-location-error" : undefined
                }
              />
              <FieldError
                id="project-location-error"
                message={errors.location}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="project-description"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Descripción
              </label>
              <textarea
                ref={descriptionRef}
                id="project-description"
                name="description"
                value={values.description}
                onChange={(event) =>
                  onFieldChange("description", event.target.value)
                }
                placeholder="Notas internas o alcance general del proyecto"
                maxLength={1000}
                rows={5}
                disabled={disabled}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={
                  errors.description ? "project-description-error" : undefined
                }
                className={cn(
                  "w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground",
                  "placeholder:text-muted",
                  "transition-colors duration-[var(--sng-duration-fast)] ease-[var(--sng-ease-standard)]",
                  "hover:border-border-strong",
                  "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-[var(--sng-color-disabled-background)] disabled:text-disabled",
                  "aria-invalid:border-danger",
                )}
              />
              <FieldError
                id="project-description-error"
                message={errors.description}
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end sm:p-6">
          <Link
            href={cancelHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full sm:w-auto",
            )}
            aria-disabled={disabled ? "true" : undefined}
            tabIndex={disabled ? -1 : undefined}
          >
            Cancelar
          </Link>
          <Button
            type="submit"
            disabled={disabled}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Creando proyecto..." : "Crear proyecto"}
          </Button>
        </div>
      </Surface>
    </form>
  );
}
