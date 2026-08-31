"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { type ReactNode, useId, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { matchesSearchText } from "@/lib/text/search-text";
import { cn } from "@/lib/utils/cn";

export interface SearchableCatalogOption {
  id: string;
  title: string;
  subtitle?: string | null;
  searchText: string;
  recommendation?: "selected" | "suggested" | "alternative" | null;
}

function recommendationLabel(value: SearchableCatalogOption["recommendation"]): string | null {
  if (value === "selected") return "Seleccionado";
  if (value === "suggested") return "Sugerido";
  if (value === "alternative") return "Alternativa";
  return null;
}

export function SearchableCatalogCombobox({
  label,
  value,
  options,
  disabled = false,
  placeholder = "Por definir",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No hay coincidencias.",
  allowEmpty = false,
  loading = false,
  onChange,
  renderOption,
}: {
  label: string;
  value: string;
  options: SearchableCatalogOption[];
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowEmpty?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
  renderOption?: (option: SearchableCatalogOption) => ReactNode;
}) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = options.find((option) => option.id === value) ?? null;
  const visible = useMemo(() => options.filter((option) => matchesSearchText(query, option.searchText)), [options, query]);

  const select = (next: string) => {
    onChange(next);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative space-y-2 text-sm font-medium text-foreground" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <label htmlFor={`${listboxId}-input`}>{label}</label>
      <div className="relative">
        <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
        <input
          id={`${listboxId}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          disabled={disabled || loading}
          value={open ? query : selected?.title ?? ""}
          placeholder={loading ? "Cargando catálogo..." : open ? searchPlaceholder : selected ? selected.title : placeholder}
          className="h-10 w-full rounded-sm border border-border bg-surface pl-9 pr-9 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
          onFocus={() => { setOpen(true); setQuery(""); setActiveIndex(0); }}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); setQuery(""); return; }
            if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, visible.length - 1)); return; }
            if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); return; }
            if (event.key === "Enter" && open && visible[activeIndex]) { event.preventDefault(); select(visible[activeIndex].id); }
          }}
        />
        <ChevronDown aria-hidden="true" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
      </div>
      {open && !disabled && !loading ? (
        <div id={listboxId} role="listbox" className="absolute z-50 max-h-72 w-full overflow-y-auto rounded-sm border border-border bg-surface-elevated p-1 shadow-lg">
          {allowEmpty ? <button type="button" role="option" aria-selected={value === ""} className="flex w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-surface-muted" onMouseDown={(event) => event.preventDefault()} onClick={() => select("")}>{placeholder}</button> : null}
          {visible.length === 0 ? <p className="px-3 py-4 text-sm text-foreground-secondary">{emptyMessage}</p> : visible.map((option, index) => {
            const badge = recommendationLabel(option.recommendation);
            return <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className={cn("flex w-full items-start gap-2 rounded-sm px-3 py-2 text-left hover:bg-surface-muted", index === activeIndex && "bg-surface-muted")}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(option.id)}
            >
              <span className="min-w-0 flex-1">{renderOption ? renderOption(option) : <><span className="block break-words font-medium text-foreground">{option.title}</span>{option.subtitle ? <span className="mt-0.5 block break-words text-xs text-foreground-secondary">{option.subtitle}</span> : null}</>}</span>
              {badge ? <Badge tone={option.recommendation === "selected" ? "success" : "neutral"}>{badge}</Badge> : null}
              {option.id === value ? <Check aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-brand" /> : null}
            </button>;
          })}
        </div>
      ) : null}
      {!open && selected?.subtitle ? <p className="text-xs font-normal text-foreground-secondary">{selected.subtitle}</p> : null}
    </div>
  );
}
