import type { InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

export function joinDescribedBy(
  ...ids: (string | undefined | false)[]
): string | undefined {
  const existingIds = ids.filter((id): id is string => Boolean(id));
  return existingIds.length > 0 ? existingIds.join(" ") : undefined;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function TextArea({
  id,
  value,
  rows = 3,
  disabled,
  describedBy,
  invalid,
  onChange,
}: {
  id: string;
  value: string;
  rows?: number;
  disabled: boolean;
  describedBy?: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      id={id}
      value={value}
      rows={rows}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "w-full resize-y rounded-sm border border-border bg-surface px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted hover:border-border-strong aria-invalid:border-danger",
        "disabled:cursor-not-allowed disabled:border-border-subtle disabled:bg-[var(--sng-color-disabled-background)] disabled:text-disabled",
      )}
    />
  );
}

export function TextInputField({
  id,
  label,
  value,
  error,
  disabled,
  maxLength,
  inputMode,
  onChange,
  describedBy,
  forceInvalid,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  maxLength?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  describedBy?: string;
  forceInvalid?: boolean;
  onChange: (value: string) => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-foreground">
        {label}
      </label>
      <Input
        id={id}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        disabled={disabled}
        aria-invalid={Boolean(error || forceInvalid) || undefined}
        aria-describedby={joinDescribedBy(error ? errorId : undefined, describedBy)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
