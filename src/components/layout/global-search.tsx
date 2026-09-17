"use client";

import {
  FileText,
  FolderKanban,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { Input } from "@/components/ui/input";
import { searchGlobal } from "@/features/search/global-search-api";
import type {
  GlobalSearchResult,
} from "@/features/search/global-search-types";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

const EMPTY_RESULT: GlobalSearchResult = {
  projects: [],
  preQuotes: [],
  clients: [],
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] =
    useState<GlobalSearchResult>(EMPTY_RESULT);
  const [isLoading, setIsLoading] =
    useState(false);
  const [isOpen, setIsOpen] =
    useState(false);
  const [hasError, setHasError] =
    useState(false);

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const requestIdRef =
    useRef(0);

  useEffect(() => {
    const normalizedQuery =
      query.trim();

    if (
      normalizedQuery.length <
      MIN_SEARCH_LENGTH
    ) {
      setResult(EMPTY_RESULT);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    const timer = window.setTimeout(() => {
      const requestId =
        requestIdRef.current + 1;

      requestIdRef.current =
        requestId;

      setIsLoading(true);
      setHasError(false);

      void searchGlobal(normalizedQuery)
        .then((response) => {
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setResult(response);
          setIsOpen(true);
        })
        .catch(() => {
          if (
            requestId !==
            requestIdRef.current
          ) {
            return;
          }

          setResult(EMPTY_RESULT);
          setHasError(true);
          setIsOpen(true);
        })
        .finally(() => {
          if (
            requestId ===
            requestIdRef.current
          ) {
            setIsLoading(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function handleDocumentMouseDown(
      event: MouseEvent,
    ) {
      const target =
        event.target as Node | null;

      if (
        target &&
        containerRef.current &&
        !containerRef.current.contains(
          target,
        )
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleDocumentMouseDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentMouseDown,
      );
    };
  }, []);

  const normalizedQuery =
    query.trim();

  const hasResults =
    result.projects.length > 0 ||
    result.preQuotes.length > 0 ||
    result.clients.length > 0;

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Escape") {
      setIsOpen(false);
      event.currentTarget.blur();
    }
  }

  function closeResults() {
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden min-w-0 flex-1 md:block lg:max-w-xl"
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted"
        size={18}
        strokeWidth={1.75}
      />

      <Input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);

          if (
            event.target.value.trim().length >=
            MIN_SEARCH_LENGTH
          ) {
            setIsOpen(true);
          }
        }}
        onFocus={() => {
          if (
            normalizedQuery.length >=
            MIN_SEARCH_LENGTH
          ) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        aria-label="Búsqueda global"
        placeholder="Buscar proyectos, cotizaciones, clientes..."
        autoComplete="off"
        className="border-border-subtle bg-surface-subtle pl-10 pr-10"
      />

      {isLoading ? (
        <LoaderCircle
          aria-hidden="true"
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted"
          size={17}
          strokeWidth={1.75}
        />
      ) : null}

      {isOpen &&
      normalizedQuery.length >=
        MIN_SEARCH_LENGTH ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] overflow-y-auto rounded-md border border-border-subtle bg-surface shadow-lg">
          {hasError ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">
                No fue posible realizar la búsqueda
              </p>

              <p className="mt-1 text-xs text-muted">
                Intenta nuevamente.
              </p>
            </div>
          ) : isLoading &&
            !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              Buscando...
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-foreground">
                Sin resultados
              </p>

              <p className="mt-1 text-xs text-muted">
                No encontramos coincidencias para “{normalizedQuery}”.
              </p>
            </div>
          ) : (
            <div className="py-2">
              {result.projects.length >
              0 ? (
                <SearchSection
                  title="Proyectos"
                  icon={
                    <FolderKanban
                      size={16}
                      strokeWidth={1.75}
                    />
                  }
                >
                  {result.projects.map(
                    (project) => (
                      <SearchResultLink
                        key={
                          project.projectId
                        }
                        href={`/projects/${project.projectId}`}
                        title={`${project.code} · ${project.name}`}
                        subtitle={
                          project.clientName
                        }
                        onClick={
                          closeResults
                        }
                      />
                    ),
                  )}
                </SearchSection>
              ) : null}

              {result.preQuotes.length >
              0 ? (
                <SearchSection
                  title="Precotizaciones"
                  icon={
                    <FileText
                      size={16}
                      strokeWidth={1.75}
                    />
                  }
                >
                  {result.preQuotes.map(
                    (preQuote) => (
                      <SearchResultLink
                        key={
                          preQuote.preQuoteId
                        }
                        href={`/projects/${preQuote.projectId}/prequotes/${preQuote.preQuoteId}`}
                        title={
                          preQuote.name
                            ? `${preQuote.serial} · ${preQuote.name}`
                            : preQuote.serial
                        }
                        subtitle={`${preQuote.projectCode} · ${preQuote.projectName}`}
                        onClick={
                          closeResults
                        }
                      />
                    ),
                  )}
                </SearchSection>
              ) : null}

              {result.clients.length >
              0 ? (
                <SearchSection
                  title="Clientes"
                  icon={
                    <Users
                      size={16}
                      strokeWidth={1.75}
                    />
                  }
                >
                  {result.clients.map(
                    (client) => {
                      const document =
                        [
                          client.documentType,
                          client.documentNumber,
                        ]
                          .filter(Boolean)
                          .join(" ");

                      return (
                        <SearchResultLink
                          key={
                            client.clientId
                          }
                          href={`/clients/${client.clientId}`}
                          title={
                            client.name
                          }
                          subtitle={
                            document ||
                            "Cliente"
                          }
                          onClick={
                            closeResults
                          }
                        />
                      );
                    },
                  )}
                </SearchSection>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface SearchSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SearchSection({
  title,
  icon,
  children,
}: SearchSectionProps) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {icon}
        {title}
      </div>

      <div>
        {children}
      </div>
    </div>
  );
}

interface SearchResultLinkProps {
  href: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function SearchResultLink({
  href,
  title,
  subtitle,
  onClick,
}: SearchResultLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 transition-colors hover:bg-surface-subtle"
    >
      <p className="truncate text-sm font-medium text-foreground">
        {title}
      </p>

      <p className="mt-1 truncate text-xs text-muted">
        {subtitle}
      </p>
    </Link>
  );
}