"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ProjectCreateSuccess } from "@/features/projects/components/project-create-success";
import { ProjectForm } from "@/features/projects/components/project-form";
import { useCreateProject } from "@/features/projects/use-create-project";
import { cn } from "@/lib/utils/cn";

export function ProjectCreatePageContent() {
  const {
    values,
    selectedClient,
    errors,
    isSubmitting,
    submitError,
    createdProject,
    clientSearchResetKey,
    setFieldValue,
    selectClient,
    clearSelectedClient,
    normalizeCodeField,
    submit,
    reset,
  } = useCreateProject();

  return (
    <div className="min-w-0 space-y-6">
      <header className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <Badge tone="brand">Gestión operativa</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-foreground">
            Nuevo proyecto
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-secondary">
            Selecciona un cliente activo y registra los datos iniciales del
            proyecto.
          </p>
        </div>
        <Link
          href="/projects"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-full shrink-0 sm:w-auto",
          )}
        >
          <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
          Volver a proyectos
        </Link>
      </header>

      {createdProject && selectedClient ? (
        <ProjectCreateSuccess
          createdProject={createdProject}
          selectedClient={selectedClient}
          onCreateAnother={reset}
        />
      ) : (
        <ProjectForm
          mode="create"
          values={values}
          selectedClient={selectedClient}
          errors={errors}
          isSubmitting={isSubmitting}
          serverError={submitError}
          clientSearchResetKey={clientSearchResetKey}
          onFieldChange={setFieldValue}
          onClientSelect={selectClient}
          onClientClear={clearSelectedClient}
          onCodeBlur={normalizeCodeField}
          onSubmit={submit}
          cancelHref="/projects"
        />
      )}
    </div>
  );
}
