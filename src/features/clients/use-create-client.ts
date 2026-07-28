"use client";

import { useCallback, useState } from "react";

import { createClient } from "@/features/clients/clients-api";
import type {
  ClientFormErrors,
  ClientListItem,
  CreateClientFormValues,
} from "@/features/clients/clients-types";
import {
  INITIAL_CREATE_CLIENT_FORM_VALUES,
  toCreateClientRequest,
  validateCreateClientForm,
} from "@/features/clients/client-form-validation";
import { ApiError } from "@/lib/http/api-error";

function hasErrors(errors: ClientFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

function getCreateClientErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible crear el cliente.";
  }

  switch (error.status) {
    case 0:
      return error.detail;
    case 400:
      return "Revisa los datos enviados e intenta nuevamente.";
    case 401:
      return "La sesión no es válida. Inicia sesión nuevamente.";
    case 403:
      return "Tu usuario no tiene acceso para crear clientes.";
    case 409:
      return (
        error.problemDetails?.detail ??
        "Ya existe un cliente con el tipo y número de documento indicados."
      );
    case 500:
      return "No fue posible guardar el cliente. Intenta nuevamente.";
    default:
      return "No fue posible crear el cliente.";
  }
}

export function useCreateClient() {
  const [values, setValues] = useState<CreateClientFormValues>(
    INITIAL_CREATE_CLIENT_FORM_VALUES,
  );
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdClient, setCreatedClient] = useState<ClientListItem | null>(
    null,
  );

  const setFieldValue = useCallback(
    (field: keyof CreateClientFormValues, value: string) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) {
          return current;
        }

        const nextErrors = { ...current };
        delete nextErrors[field];
        if (
          (field === "documentType" || field === "documentNumber") &&
          current.documentType === current.documentNumber
        ) {
          delete nextErrors.documentType;
          delete nextErrors.documentNumber;
        }
        if (Object.keys(nextErrors).length === 0) {
          return {};
        }
        return nextErrors;
      });
    },
    [],
  );

  const submit = useCallback(async () => {
    setSubmitError(null);
    const validationErrors = validateCreateClientForm(values);

    if (hasErrors(validationErrors)) {
      setErrors({
        ...validationErrors,
        form: "Revisa los campos marcados antes de continuar.",
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const client = await createClient(toCreateClientRequest(values));
      setCreatedClient(client);
    } catch (error: unknown) {
      setSubmitError(getCreateClientErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }, [values]);

  const reset = useCallback(() => {
    setValues(INITIAL_CREATE_CLIENT_FORM_VALUES);
    setErrors({});
    setIsSubmitting(false);
    setSubmitError(null);
    setCreatedClient(null);
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    submitError,
    createdClient,
    setFieldValue,
    submit,
    reset,
  };
}
