"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import { ArrowLeft } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/ui/surface";
import type {
  ProjectFormErrors,
  ProjectFormValues,
} from "@/features/projects/projects-types";
import { cn } from "@/lib/utils/cn";

interface FieldErrorProps {
  id: string;
  message?: string;
}

export interface ProjectEditFormProps {
  values: ProjectFormValues;
  errors: ProjectFormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
  submitError: string | null;
  showProjectsLink: boolean;
  onFieldChange: (field: keyof ProjectFormValues, value: string) => void;
  onCodeBlur: () => void;
  onSubmit: () => void;
  onCancel: () => void;
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

export function ProjectEditForm({
  values,
  errors,
  isSubmitting,
  isDirty,
  submitError,
  showProjectsLink,
  onFieldChange,
  onCodeBlur,
  onSubmit,
  onCancel,
}: ProjectEditFormProps) {
  const codeRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const lastErrorFocusKeyRef = useRef<string | undefined>(undefined);
  const disabled = isSubmitting;

  useEffect(() => {
    const errorFocusKey = [
      errors.form,
      errors.code,
      errors.name,
      errors.location,
      errors.description,
    ].join("|");

    if (!errors.form || errorFocusKey === lastErrorFocusKeyRef.current) {
      return;
    }

    lastErrorFocusKeyRef.current = errorFocusKey;

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
      <Surface padding="none" className="min-w-0 overflow-hidden">
        {submitError ? (
          <div
            role="alert"
            className="border-b border-danger bg-danger-soft px-5 py-4 text-sm font-medium text-danger sm:px-6"
          >
            <p>{submitError}</p>
            {showProjectsLink ? (
              <Link
                href="/projects"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "mt-4",
                )}
              >
                <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
                Volver a proyectos
              </Link>
            ) : null}
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
          aria-labelledby="project-edit-title"
          className="p-5 sm:p-6"
        >
          <div>
            <h2
              id="project-edit-title"
              className="text-lg font-semibold text-foreground"
            >
              Información del proyecto
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-secondary">
              Actualiza los datos principales del proyecto sin cambiar el
              cliente asociado.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="project-edit-code"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Código
              </label>
              <Input
                ref={codeRef}
                id="project-edit-code"
                name="code"
                value={values.code}
                onChange={(event) => onFieldChange("code", event.target.value)}
                onBlur={onCodeBlur}
                placeholder="PRY-001"
                maxLength={30}
                required
                disabled={disabled}
                aria-invalid={errors.code ? true : undefined}
                aria-describedby={
                  errors.code ? "project-edit-code-error" : undefined
                }
              />
              <FieldError id="project-edit-code-error" message={errors.code} />
            </div>

            <div>
              <label
                htmlFor="project-edit-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Nombre
              </label>
              <Input
                ref={nameRef}
                id="project-edit-name"
                name="name"
                value={values.name}
                onChange={(event) => onFieldChange("name", event.target.value)}
                placeholder="Fachada principal"
                maxLength={200}
                required
                disabled={disabled}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={
                  errors.name ? "project-edit-name-error" : undefined
                }
              />
              <FieldError id="project-edit-name-error" message={errors.name} />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="project-edit-location"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Ubicación
              </label>
              <Input
                ref={locationRef}
                id="project-edit-location"
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
                  errors.location ? "project-edit-location-error" : undefined
                }
              />
              <FieldError
                id="project-edit-location-error"
                message={errors.location}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="project-edit-description"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Descripción
              </label>
              <textarea
                ref={descriptionRef}
                id="project-edit-description"
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
                  errors.description
                    ? "project-edit-description-error"
                    : undefined
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
                id="project-edit-description-error"
                message={errors.description}
              />
            </div>
          </div>
        </section>

        <div
          className="flex flex-col-reverse gap-3 border-t border-border-subtle p-5 sm:flex-row sm:justify-end sm:p-6"
          aria-live="polite"
        >
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full sm:w-auto"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={disabled || !isDirty}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </Surface>
    </form>
  );
}
