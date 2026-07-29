"use client";

import { useCallback, useState } from "react";

import type { ClientListItem } from "@/features/clients/clients-types";
import { createProject } from "@/features/projects/projects-api";
import type {
  CreatedProject,
  ProjectFormErrors,
  ProjectFormValues,
} from "@/features/projects/projects-types";
import {
  INITIAL_PROJECT_FORM_VALUES,
  normalizeProjectCode,
  toCreateProjectRequest,
  validateProjectForm,
} from "@/features/projects/project-form-validation";
import { ApiError } from "@/lib/http/api-error";

function hasErrors(errors: ProjectFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

const INACTIVE_CLIENT_CONFLICT_TITLE = "Cliente inactivo";
const INACTIVE_CLIENT_CONFLICT_DETAIL =
  "No se puede crear un proyecto para un cliente inactivo.";
const DUPLICATE_CODE_CONFLICT_TITLE = "Código de proyecto duplicado";
const DUPLICATE_CODE_CONFLICT_DETAIL =
  "Ya existe un proyecto con el código indicado.";

function normalizeProblemText(value: string | undefined): string {
  return value?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";
}

function matchesProblemDetails(
  error: ApiError,
  title: string,
  detail: string,
): boolean {
  const problemTitle = error.problemDetails?.title ?? error.title;
  const problemDetail = error.problemDetails?.detail ?? error.detail;

  return (
    normalizeProblemText(problemTitle) === normalizeProblemText(title) &&
    normalizeProblemText(problemDetail) === normalizeProblemText(detail)
  );
}

export function useCreateProject() {
  const [values, setValues] = useState<ProjectFormValues>(
    INITIAL_PROJECT_FORM_VALUES,
  );
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(
    null,
  );
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] =
    useState<CreatedProject | null>(null);
  const [clientSearchResetKey, setClientSearchResetKey] = useState(0);

  const setFieldValue = useCallback(
    (field: keyof ProjectFormValues, value: string) => {
      const nextValue = field === "code" ? value.toUpperCase() : value;
      setValues((current) => ({ ...current, [field]: nextValue }));
      setErrors((current) => {
        if (!current[field]) {
          return current;
        }

        const nextErrors = { ...current };
        delete nextErrors[field];
        delete nextErrors.form;
        return nextErrors;
      });
    },
    [],
  );

  const selectClient = useCallback((client: ClientListItem) => {
    if (!client.isActive) {
      setErrors((current) => ({
        ...current,
        client: "Selecciona un cliente activo.",
      }));
      return;
    }

    setSelectedClient(client);
    setErrors((current) => {
      if (!current.client) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.client;
      delete nextErrors.form;
      return nextErrors;
    });
  }, []);

  const clearSelectedClient = useCallback(() => {
    setSelectedClient(null);
    setErrors((current) => {
      if (!current.client) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors.client;
      delete nextErrors.form;
      return nextErrors;
    });
  }, []);

  const submit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setSubmitError(null);
    const validationErrors = validateProjectForm(
      values,
      selectedClient?.id ?? null,
    );

    if (hasErrors(validationErrors)) {
      setErrors({
        ...validationErrors,
        form: "Revisa los campos marcados antes de continuar.",
      });
      return;
    }

    if (!selectedClient) {
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const project = await createProject(
        toCreateProjectRequest(values, selectedClient.id),
      );
      setCreatedProject(project);
    } catch (error: unknown) {
      if (!(error instanceof ApiError)) {
        setSubmitError("No fue posible crear el proyecto. Intenta nuevamente.");
        return;
      }

      if (error.status === 0) {
        setSubmitError(
          "No fue posible conectar con el servidor. Verifica la conexión e inténtalo nuevamente.",
        );
        return;
      }

      if (error.status === 400) {
        setSubmitError("Revisa los datos enviados e intenta nuevamente.");
        return;
      }

      if (error.status === 401) {
        setSubmitError("La sesión no es válida. Inicia sesión nuevamente.");
        return;
      }

      if (error.status === 403) {
        setSubmitError("No tienes permisos para crear proyectos.");
        return;
      }

      if (error.status === 404) {
        setSelectedClient(null);
        setErrors({
          client:
            "El cliente seleccionado ya no está disponible. Selecciona otro cliente activo.",
          form: "Selecciona otro cliente activo antes de continuar.",
        });
        setClientSearchResetKey((current) => current + 1);
        setSubmitError(
          "El cliente seleccionado ya no está disponible. Selecciona otro cliente activo.",
        );
        return;
      }

      if (error.status === 409) {
        if (
          matchesProblemDetails(
            error,
            INACTIVE_CLIENT_CONFLICT_TITLE,
            INACTIVE_CLIENT_CONFLICT_DETAIL,
          )
        ) {
          setSelectedClient(null);
          setErrors({
            client:
              "El cliente seleccionado ya no está activo. Selecciona otro cliente.",
            form: "Selecciona otro cliente activo antes de continuar.",
          });
          setClientSearchResetKey((current) => current + 1);
          setSubmitError(
            "El cliente seleccionado ya no está activo. Selecciona otro cliente.",
          );
          return;
        }

        if (
          matchesProblemDetails(
            error,
            DUPLICATE_CODE_CONFLICT_TITLE,
            DUPLICATE_CODE_CONFLICT_DETAIL,
          )
        ) {
          setErrors({
            code: "Ya existe un proyecto con este código.",
            form: "Corrige el código del proyecto antes de continuar.",
          });
          return;
        }

        setSubmitError(
          "No fue posible crear el proyecto debido a un conflicto. Revisa los datos e inténtalo nuevamente.",
        );
        return;
      }

      setSubmitError("No fue posible crear el proyecto. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, selectedClient, values]);

  const reset = useCallback(() => {
    setValues(INITIAL_PROJECT_FORM_VALUES);
    setSelectedClient(null);
    setErrors({});
    setIsSubmitting(false);
    setSubmitError(null);
    setCreatedProject(null);
    setClientSearchResetKey((current) => current + 1);
  }, []);

  const normalizeCodeField = useCallback(() => {
    setValues((current) => ({
      ...current,
      code: normalizeProjectCode(current.code),
    }));
  }, []);

  return {
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
  };
}
