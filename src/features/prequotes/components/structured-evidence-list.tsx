import {
  formatEvidenceSource,
  formatSourcePages,
} from "@/features/prequotes/structured-extraction-formatters";
import type { StructuredEvidence } from "@/features/prequotes/structured-extraction-types";

export function SourcePages({ pages }: { pages: number[] }) {
  return (
    <p className="text-sm text-foreground-secondary">
      {formatSourcePages(pages)}
    </p>
  );
}

export function StructuredEvidenceList({
  evidence,
}: {
  evidence: StructuredEvidence[];
}) {
  if (evidence.length === 0) {
    return null;
  }

  return (
    <details className="rounded-sm border border-border-subtle bg-surface-subtle p-3">
      <summary className="cursor-pointer text-sm font-semibold text-foreground">
        Ver {evidence.length} {evidence.length === 1 ? "evidencia" : "evidencias"}
      </summary>
      <ul className="mt-3 space-y-3">
        {evidence.map((item, index) => (
          <li
            key={`${item.pageNumber}-${item.sourceType}-${index}`}
            className="min-w-0 rounded-sm bg-surface p-3"
          >
            <p className="text-xs font-semibold uppercase text-foreground-secondary">
              Página {item.pageNumber} · {formatEvidenceSource(item.sourceType)}
            </p>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
              {item.text}
            </p>
          </li>
        ))}
      </ul>
    </details>
  );
}
