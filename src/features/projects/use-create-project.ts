"use client";

import { useCallback, useState } from "react";

import type { ClientListItem } from "@/features/clients/clients-types";
import { classifyProjectCreateError } from "@/features/projects/project-create-error";
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

function hasErrors(errors: ProjectFormErrors): boolean {
  return Object.keys(errors).length > 0;
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
      setErrors({});
      setSubmitError(null);
      setCreatedProject(project);
    } catch (error: unknown) {
      const classifiedError = classifyProjectCreateError(error);

      if (classifiedError.field === "client") {
        if (classifiedError.resetClientSelection) {
          setSelectedClient(null);
          setClientSearchResetKey((current) => current + 1);
        }
        setErrors({
          client: classifiedError.message,
          form: classifiedError.formMessage,
        });
        return;
      }

      if (classifiedError.field === "code") {
        setErrors({
          code: classifiedError.message,
          form: classifiedError.formMessage,
        });
        return;
      }

      setSubmitError(classifiedError.message);
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
