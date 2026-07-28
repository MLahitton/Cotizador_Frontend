"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ClientActivationConfirmation } from "@/features/clients/components/client-activation-confirmation";
import { ClientForm } from "@/features/clients/components/client-form";
import {
  ClientDetailsErrorFeedback,
  ClientDetailsLoading,
  InvalidClientIdFeedback,
} from "@/features/clients/components/client-details-feedback";
import { ClientDetailsView } from "@/features/clients/components/client-details-view";
import type {
  ClientDetails,
  ClientFormErrors,
  CreateClientFormValues,
} from "@/features/clients/clients-types";
import {
  toClientPayload,
  validateClientForm,
} from "@/features/clients/client-form-validation";
import { useClientDetails } from "@/features/clients/use-client-details";
import { useSetClientActivation } from "@/features/clients/use-set-client-activation";
import { useUpdateClient } from "@/features/clients/use-update-client";
import { ApiError } from "@/lib/http/api-error";
import { cn } from "@/lib/utils/cn";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidClientId(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

function hasErrors(errors: ClientFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

function toFormValues(client: ClientDetails): CreateClientFormValues {
  return {
    clientType: client.clientType,
    legalName: client.legalName,
    tradeName: client.tradeName ?? "",
    documentType: client.documentType ?? "",
    documentNumber: client.documentNumber ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    city: client.city ?? "",
  };
}

function getUpdateErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible guardar los cambios del cliente.";
  }

  switch (error.status) {
    case 0:
      return "No fue posible conectar con el servidor.";
    case 400:
      return "Los datos enviados no son válidos.";
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes permiso para actualizar clientes.";
    case 404:
      return "El cliente ya no existe o no está disponible.";
    case 409:
      return "Ya existe otro cliente con el tipo y número de documento indicados.";
    default:
      return "No fue posible guardar los cambios del cliente.";
  }
}

function ClientDetailsLoadedContent({ clientId }: { clientId: string }) {
  const { client, error, isLoading, reload, replaceClient } =
    useClientDetails(clientId);
  const {
    update,
    isSubmitting,
    error: updateError,
    resetError,
  } = useUpdateClient();
  const {
    setActivation,
    isSubmitting: isActivationSubmitting,
    error: activationError,
    resetError: resetActivationError,
  } = useSetClientActivation();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<CreateClientFormValues | null>(null);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activationTarget, setActivationTarget] = useState<boolean | null>(
    null,
  );

  const startEditing = useCallback(() => {
    if (!client) {
      return;
    }

    setValues(toFormValues(client));
    setErrors({});
    resetError();
    resetActivationError();
    setSuccessMessage(null);
    setActivationTarget(null);
    setIsEditing(true);
  }, [client, resetActivationError, resetError]);

  const cancelEditing = useCallback(() => {
    setValues(client ? toFormValues(client) : null);
    setErrors({});
    resetError();
    setIsEditing(false);
  }, [client, resetError]);

  const openActivationConfirmation = useCallback(() => {
    if (!client || isEditing || isActivationSubmitting) {
      return;
    }

    resetActivationError();
    setSuccessMessage(null);
    setActivationTarget(!client.isActive);
  }, [client, isActivationSubmitting, isEditing, resetActivationError]);

  const cancelActivationConfirmation = useCallback(() => {
    if (isActivationSubmitting) {
      return;
    }

    setActivationTarget(null);
    resetActivationError();
  }, [isActivationSubmitting, resetActivationError]);

  const confirmActivation = useCallback(async () => {
    if (!client || activationTarget === null || isActivationSubmitting) {
      return;
    }

    if (activationTarget === client.isActive) {
      setActivationTarget(null);
      resetActivationError();
      return;
    }

    const updatedClient = await setActivation(clientId, activationTarget);

    if (!updatedClient) {
      return;
    }

    replaceClient(updatedClient);
    setActivationTarget(null);
    setSuccessMessage(
      activationTarget
        ? "Cliente activado correctamente."
        : "Cliente desactivado correctamente.",
    );
  }, [
    activationTarget,
    client,
    clientId,
    isActivationSubmitting,
    replaceClient,
    resetActivationError,
    setActivation,
  ]);

  const setFieldValue = useCallback(
    (field: keyof CreateClientFormValues, value: string) => {
      resetError();
      setValues((current) =>
        current ? { ...current, [field]: value } : current,
      );
      setErrors((current) => {
        if (!current[field]) {
          return current;
        }

        const nextErrors = { ...current };
        delete nextErrors[field];

        if (field === "documentType" || field === "documentNumber") {
          delete nextErrors.documentType;
          delete nextErrors.documentNumber;
        }

        return Object.keys(nextErrors).length === 0 ? {} : nextErrors;
      });
    },
    [resetError],
  );

  const submit = useCallback(async () => {
    if (!values || isSubmitting) {
      return;
    }

    resetError();
    const validationErrors = validateClientForm(values);

    if (hasErrors(validationErrors)) {
      setErrors({
        ...validationErrors,
        form: "Revisa los campos marcados antes de continuar.",
      });
      return;
    }

    setErrors({});
    const updatedClient = await update(clientId, toClientPayload(values));

    if (!updatedClient) {
      return;
    }

    replaceClient(updatedClient);
    setValues(toFormValues(updatedClient));
    setIsEditing(false);
    setActivationTarget(null);
    resetActivationError();
    setSuccessMessage("Cliente actualizado correctamente.");
  }, [
    clientId,
    isSubmitting,
    replaceClient,
    resetActivationError,
    resetError,
    update,
    values,
  ]);

  if (isLoading) {
    return <ClientDetailsLoading />;
  }

  if (error) {
    return <ClientDetailsErrorFeedback error={error} onRetry={reload} />;
  }

  if (!client) {
    return (
      <ClientDetailsErrorFeedback
        error={{
          cause: new ApiError({
            status: 404,
            title: "Cliente no encontrado",
            detail: "No existe un cliente con el identificador indicado.",
          }),
        }}
        onRetry={reload}
      />
    );
  }

  if (isEditing && values) {
    return (
      <div className="space-y-6" aria-busy={isSubmitting ? "true" : undefined}>
        <header className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Link
              href="/clients"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "mb-4 w-full justify-start px-0 sm:w-auto",
              )}
            >
              <ArrowLeft aria-hidden="true" size={17} strokeWidth={1.75} />
              Volver a clientes
            </Link>
            <Badge tone="brand">Clientes</Badge>
            <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Editar cliente
              </h1>
              <Badge tone={client.isActive ? "success" : "neutral"} size="sm">
                {client.isActive ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-foreground-secondary">
              {client.legalName}
            </p>
          </div>
        </header>

        {updateError ? (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-sm border border-danger bg-danger-soft p-4 text-sm font-medium text-danger"
          >
            {getUpdateErrorMessage(updateError.cause)}
            {updateError.cause instanceof ApiError &&
            updateError.cause.status === 404 ? (
              <div className="mt-4">
                <Link
                  href="/clients"
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  <ArrowLeft
                    aria-hidden="true"
                    size={17}
                    strokeWidth={1.75}
                  />
                  Volver a clientes
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}

        <ClientForm
          values={values}
          errors={errors}
          isSubmitting={isSubmitting}
          submitLabel="Guardar cambios"
          submittingLabel="Guardando cambios..."
          cancelLabel="Cancelar edición"
          onFieldChange={setFieldValue}
          onSubmit={submit}
          onCancel={cancelEditing}
        />
      </div>
    );
  }

  return (
    <ClientDetailsView
      client={client}
      successMessage={successMessage}
      isEditDisabled={activationTarget !== null || isActivationSubmitting}
      isActivationDisabled={activationTarget !== null || isActivationSubmitting}
      activationConfirmation={
        activationTarget !== null ? (
          <ClientActivationConfirmation
            legalName={client.legalName}
            targetIsActive={activationTarget}
            isSubmitting={isActivationSubmitting}
            error={activationError}
            onConfirm={confirmActivation}
            onCancel={cancelActivationConfirmation}
          />
        ) : null
      }
      onEdit={startEditing}
      onRequestActivation={openActivationConfirmation}
    />
  );
}

export function ClientDetailsPageContent({ clientId }: { clientId: string }) {
  if (!isValidClientId(clientId)) {
    return <InvalidClientIdFeedback />;
  }

  return <ClientDetailsLoadedContent clientId={clientId} />;
}
