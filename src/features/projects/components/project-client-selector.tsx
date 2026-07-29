"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Check, LoaderCircle, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClientListItem } from "@/features/clients/clients-types";
import {
  getClientDisplayName,
  getClientLocationLabel,
  getClientSecondaryLabel,
} from "@/features/projects/project-formatters";
import { useActiveClientSearch } from "@/features/projects/use-active-client-search";
import { ApiError } from "@/lib/http/api-error";

export interface ProjectClientSelectorHandle {
  focusSearch: () => void;
}

interface ProjectClientSelectorProps {
  selectedClient: ClientListItem | null;
  error?: string;
  disabled?: boolean;
  resetKey: number;
  onClientSelect: (client: ClientListItem) => void;
  onClientClear: () => void;
}

function getSearchErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No fue posible cargar los clientes activos.";
  }

  if (error.status === 0) {
    return "No fue posible cargar los clientes activos.";
  }

  if (error.status === 401) {
    return "Tu sesión no es válida o expiró.";
  }

  if (error.status === 403) {
    return "No tienes permisos para consultar clientes.";
  }

  return "No fue posible consultar los clientes.";
}

export const ProjectClientSelector = forwardRef<
  ProjectClientSelectorHandle,
  ProjectClientSelectorProps
>(function ProjectClientSelector(
  { selectedClient, error, disabled, resetKey, onClientSelect, onClientClear },
  ref,
) {
  const {
    items,
    totalCount,
    searchInput,
    appliedSearch,
    error: searchError,
    isLoading,
    isRefreshing,
    pageSize,
    changeSearchInput,
    refresh,
    retry,
    resetSearch,
  } = useActiveClientSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const listboxId = useId();
  const errorId = `${inputId}-error`;
  const searchErrorId = `${inputId}-search-error`;
  const activeClient = activeIndex >= 0 ? items[activeIndex] : null;
  const activeOptionId = activeClient
    ? `${listboxId}-option-${activeClient.id}`
    : undefined;
  const describedBy = [
    error ? errorId : null,
    searchError ? searchErrorId : null,
  ]
    .filter((value): value is string => value !== null)
    .join(" ");
  const isRequesting = isLoading || isRefreshing;

  useImperativeHandle(
    ref,
    () => ({
      focusSearch: () => {
        inputRef.current?.focus();
      },
    }),
    [],
  );

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const openSelector = useCallback(() => {
    setIsOpen((wasOpen) => {
      if (!wasOpen && !isRequesting) {
        refresh();
      }

      return true;
    });
  }, [isRequesting, refresh]);

  useEffect(() => {
    if (resetKey === 0) {
      return;
    }

    setIsOpen(true);
    setActiveIndex(-1);
    refresh();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [refresh, resetKey]);

  const selectActiveClient = useCallback(
    (client: ClientListItem) => {
      onClientSelect(client);
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [onClientSelect],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openSelector();
      setActiveIndex((current) =>
        items.length === 0 ? -1 : Math.min(current + 1, items.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      openSelector();
      setActiveIndex((current) =>
        items.length === 0 ? -1 : Math.max(current - 1, 0),
      );
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      if (activeClient) {
        selectActiveClient(activeClient);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleClearClient = () => {
    onClientClear();
    resetSearch();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  if (selectedClient) {
    return (
      <div>
        <p className="mb-2 text-sm font-semibold text-foreground">Cliente</p>
        <div className="rounded-sm border border-border bg-surface-subtle p-4">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-foreground-secondary">
                Cliente seleccionado
              </p>
              <p className="mt-2 break-words font-semibold text-foreground">
                {getClientDisplayName(selectedClient)}
              </p>
              <p className="mt-1 break-words text-sm text-foreground-secondary">
                {getClientSecondaryLabel(selectedClient)}
              </p>
              {getClientLocationLabel(selectedClient) ? (
                <p className="mt-1 break-words text-sm text-foreground-secondary">
                  {getClientLocationLabel(selectedClient)}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full shrink-0 sm:w-auto"
              onClick={handleClearClient}
            >
              <X aria-hidden="true" size={17} strokeWidth={1.75} />
              Cambiar cliente
            </Button>
          </div>
        </div>
        {error ? (
          <p id={errorId} className="mt-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <label
        htmlFor={inputId}
        className="mb-2 block text-sm font-semibold text-foreground"
      >
        Cliente
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          size={17}
          strokeWidth={1.75}
        />
        <Input
          ref={inputRef}
          id={inputId}
          value={searchInput}
          onFocus={openSelector}
          onChange={(event) => {
            changeSearchInput(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por nombre, documento, correo, teléfono o ciudad"
          maxLength={200}
          disabled={disabled}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          aria-invalid={error || searchError ? true : undefined}
          aria-describedby={describedBy || undefined}
          className="pl-9"
        />
      </div>
      {error ? (
        <p id={errorId} className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {isOpen ? (
        <div className="absolute z-20 mt-2 max-h-80 w-full overflow-hidden rounded-sm border border-border bg-surface shadow-sm">
          <div className="border-b border-border-subtle px-3 py-2">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {isLoading ? (
                <p
                  className="flex items-center gap-2 text-sm text-foreground-secondary"
                  role="status"
                  aria-live="polite"
                >
                  <LoaderCircle aria-hidden="true" size={16} strokeWidth={1.75} />
                  Cargando clientes...
                </p>
              ) : isRefreshing ? (
                <p
                  className="text-sm text-foreground-secondary"
                  role="status"
                  aria-live="polite"
                >
                  Actualizando clientes...
                </p>
              ) : (
                <p className="text-sm text-foreground-secondary">
                  {totalCount > pageSize
                    ? `Mostrando los primeros ${pageSize} clientes. Refina la búsqueda para acotar resultados.`
                    : `${items.length} clientes activos`}
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || isRequesting}
                className="w-full sm:w-auto"
                onClick={refresh}
              >
                {isRequesting ? "Actualizando..." : "Actualizar clientes"}
              </Button>
            </div>
          </div>

          {searchError ? (
            <div id={searchErrorId} className="p-3" role="alert">
              <p className="text-sm text-danger">
                {getSearchErrorMessage(searchError)}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={retry}
              >
                Reintentar
              </Button>
            </div>
          ) : items.length === 0 && !isLoading ? (
            <p className="p-3 text-sm text-foreground-secondary">
              {appliedSearch
                ? "No encontramos clientes activos para esta búsqueda."
                : "No hay clientes activos disponibles."}
            </p>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              className="max-h-64 overflow-y-auto py-1"
            >
              {items.map((client, index) => {
                const isActive = index === activeIndex;
                const optionId = `${listboxId}-option-${client.id}`;

                return (
                  <li
                    id={optionId}
                    key={client.id}
                    role="option"
                    aria-selected={isActive}
                    className="px-1"
                  >
                    <button
                      type="button"
                      className="flex w-full min-w-0 items-start gap-3 rounded-sm px-3 py-3 text-left hover:bg-surface-subtle focus:bg-surface-subtle focus:outline-none"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectActiveClient(client)}
                    >
                      <Check
                        aria-hidden="true"
                        className={
                          isActive
                            ? "mt-0.5 shrink-0 text-brand"
                            : "mt-0.5 shrink-0 text-transparent"
                        }
                        size={17}
                        strokeWidth={1.75}
                      />
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold text-foreground">
                          {getClientDisplayName(client)}
                        </span>
                        <span className="mt-1 block break-words text-sm text-foreground-secondary">
                          {getClientSecondaryLabel(client)}
                        </span>
                        {getClientLocationLabel(client) ? (
                          <span className="mt-1 block break-words text-sm text-foreground-secondary">
                            {getClientLocationLabel(client)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
});
