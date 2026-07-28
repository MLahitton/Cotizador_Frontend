import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

const SEARCH_DESCRIPTION_ID = "global-search-description";

export function GlobalSearch() {
  return (
    <div className="relative min-w-0 flex-1 lg:max-w-xl">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        size={18}
        strokeWidth={1.75}
      />
      <Input
        type="search"
        readOnly
        aria-label="Búsqueda global, disponible próximamente"
        aria-describedby={SEARCH_DESCRIPTION_ID}
        placeholder="Buscar proyectos, cotizaciones, clientes..."
        className="cursor-default border-border-subtle bg-surface-subtle pl-10"
      />
      <span id={SEARCH_DESCRIPTION_ID} className="sr-only">
        La búsqueda global se habilitará en una fase posterior.
      </span>
    </div>
  );
}
