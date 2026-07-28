import Link from "next/link";
import type { FormEvent } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import type {
  ClientFormErrors,
  CreateClientFormValues,
} from "@/features/clients/clients-types";
import { cn } from "@/lib/utils/cn";

interface ClientFormProps {
  values: CreateClientFormValues;
  errors: ClientFormErrors;
  isSubmitting: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  onFieldChange: (field: keyof CreateClientFormValues, value: string) => void;
  onSubmit: () => void;
  cancelHref?: string;
  onCancel?: () => void;
}

interface FieldErrorProps {
  id: string;
  message?: string;
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

export function ClientForm({
  values,
  errors,
  isSubmitting,
  submitLabel = "Guardar cliente",
  submittingLabel = "Guardando cliente...",
  cancelLabel = "Cancelar",
  onFieldChange,
  onSubmit,
  cancelHref,
  onCancel,
}: ClientFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const disabled = isSubmitting;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Surface padding="none" className="min-w-0 max-w-5xl overflow-hidden">
        {errors.form ? (
          <div
            role="alert"
            className="border-b border-danger bg-danger-soft px-5 py-4 text-sm font-medium text-danger sm:px-6"
          >
            {errors.form}
          </div>
        ) : null}

        <section
          aria-labelledby="client-identification-title"
          className="border-b border-border-subtle p-5 sm:p-6"
        >
          <div>
            <h2
              id="client-identification-title"
              className="text-lg font-semibold text-foreground"
            >
              Identificación
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Información principal y documentos del cliente.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="client-type"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Tipo de cliente
              </label>
              <Select
                id="client-type"
                name="clientType"
                value={values.clientType}
                onChange={(event) =>
                  onFieldChange("clientType", event.target.value)
                }
                required
                disabled={disabled}
                aria-invalid={errors.clientType ? true : undefined}
                aria-describedby={
                  errors.clientType ? "client-type-error" : undefined
                }
              >
                <option value="">Selecciona un tipo</option>
                <option value="Company">Empresa</option>
                <option value="Person">Persona</option>
              </Select>
              <FieldError id="client-type-error" message={errors.clientType} />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="legal-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Nombre legal o nombre completo
              </label>
              <Input
                id="legal-name"
                name="legalName"
                value={values.legalName}
                onChange={(event) =>
                  onFieldChange("legalName", event.target.value)
                }
                placeholder="Escribe la razón social o el nombre completo"
                maxLength={200}
                required
                disabled={disabled}
                aria-invalid={errors.legalName ? true : undefined}
                aria-describedby={
                  errors.legalName ? "legal-name-error" : undefined
                }
              />
              <FieldError id="legal-name-error" message={errors.legalName} />
            </div>

            <div>
              <label
                htmlFor="trade-name"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Nombre comercial
              </label>
              <Input
                id="trade-name"
                name="tradeName"
                value={values.tradeName}
                onChange={(event) =>
                  onFieldChange("tradeName", event.target.value)
                }
                placeholder="Nombre con el que se identifica comercialmente"
                maxLength={200}
                disabled={disabled}
                aria-invalid={errors.tradeName ? true : undefined}
                aria-describedby={
                  errors.tradeName ? "trade-name-error" : undefined
                }
              />
              <FieldError id="trade-name-error" message={errors.tradeName} />
            </div>

            <div>
              <label
                htmlFor="document-type"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Tipo de documento
              </label>
              <Select
                id="document-type"
                name="documentType"
                value={values.documentType}
                onChange={(event) =>
                  onFieldChange("documentType", event.target.value)
                }
                disabled={disabled}
                aria-invalid={errors.documentType ? true : undefined}
                aria-describedby={
                  errors.documentType ? "document-type-error" : undefined
                }
              >
                <option value="">Sin documento</option>
                <option value="Nit">NIT</option>
                <option value="CitizenshipCard">
                  Cédula de ciudadanía
                </option>
                <option value="ForeignerId">Cédula de extranjería</option>
                <option value="Passport">Pasaporte</option>
                <option value="Other">Otro</option>
              </Select>
              <FieldError
                id="document-type-error"
                message={errors.documentType}
              />
            </div>

            <div>
              <label
                htmlFor="document-number"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Número de documento
              </label>
              <Input
                id="document-number"
                name="documentNumber"
                value={values.documentNumber}
                onChange={(event) =>
                  onFieldChange("documentNumber", event.target.value)
                }
                placeholder="Número de identificación"
                maxLength={50}
                disabled={disabled}
                aria-invalid={errors.documentNumber ? true : undefined}
                aria-describedby={
                  errors.documentNumber ? "document-number-error" : undefined
                }
              />
              <FieldError
                id="document-number-error"
                message={errors.documentNumber}
              />
            </div>
          </div>
        </section>

        <section
          aria-labelledby="client-contact-title"
          className="border-b border-border-subtle p-5 sm:p-6"
        >
          <div>
            <h2
              id="client-contact-title"
              className="text-lg font-semibold text-foreground"
            >
              Información de contacto
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Datos utilizados para comunicarse y ubicar al cliente.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="client-email"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Correo electrónico
              </label>
              <Input
                id="client-email"
                name="email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  onFieldChange("email", event.target.value)
                }
                placeholder="correo@empresa.com"
                maxLength={320}
                disabled={disabled}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={
                  errors.email ? "client-email-error" : undefined
                }
              />
              <FieldError id="client-email-error" message={errors.email} />
            </div>

            <div>
              <label
                htmlFor="client-phone"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Teléfono
              </label>
              <Input
                id="client-phone"
                name="phone"
                type="tel"
                value={values.phone}
                onChange={(event) =>
                  onFieldChange("phone", event.target.value)
                }
                placeholder="+57 300 000 0000"
                maxLength={50}
                disabled={disabled}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={
                  errors.phone ? "client-phone-error" : undefined
                }
              />
              <FieldError id="client-phone-error" message={errors.phone} />
            </div>

            <div>
              <label
                htmlFor="client-city"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Ciudad
              </label>
              <Input
                id="client-city"
                name="city"
                value={values.city}
                onChange={(event) =>
                  onFieldChange("city", event.target.value)
                }
                placeholder="Ciudad del cliente"
                maxLength={100}
                disabled={disabled}
                aria-invalid={errors.city ? true : undefined}
                aria-describedby={
                  errors.city ? "client-city-error" : undefined
                }
              />
              <FieldError id="client-city-error" message={errors.city} />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="client-address"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Dirección
              </label>
              <Input
                id="client-address"
                name="address"
                value={values.address}
                onChange={(event) =>
                  onFieldChange("address", event.target.value)
                }
                placeholder="Dirección principal"
                maxLength={300}
                disabled={disabled}
                aria-invalid={errors.address ? true : undefined}
                aria-describedby={
                  errors.address ? "client-address-error" : undefined
                }
              />
              <FieldError id="client-address-error" message={errors.address} />
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 p-5 sm:flex-row sm:justify-end sm:p-6">
          {cancelHref ? (
            <Link
              href={cancelHref}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full sm:w-auto",
              )}
              aria-disabled={disabled ? "true" : undefined}
              tabIndex={disabled ? -1 : undefined}
            >
              {cancelLabel}
            </Link>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full sm:w-auto"
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            disabled={disabled}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </Surface>
    </form>
  );
}
