import { Surface } from "@/components/ui/surface";
import { PreQuoteDraftItemCard } from "@/features/prequotes/components/prequote-draft-item-card";
import type { PreQuoteDraftItem } from "@/features/prequotes/prequote-draft-types";

export function PreQuoteDraftItemsSection({
  items,
}: {
  items: PreQuoteDraftItem[];
}) {
  const sortedItems = [...items].sort((left, right) => left.sequence - right.sequence);

  return (
    <section id="draft-items" aria-labelledby="draft-items-title" className="space-y-3">
      <div>
        <h2 id="draft-items-title" className="text-lg font-semibold text-foreground">
          Ítems
        </h2>
        <p className="mt-1 text-sm text-foreground-secondary">
          Detalle read-only de los ítems incluidos y excluidos del borrador.
        </p>
      </div>

      {sortedItems.length === 0 ? (
        <Surface>
          <p className="text-sm text-foreground-secondary">
            No hay ítems registrados en el borrador.
          </p>
        </Surface>
      ) : (
        <ul className="space-y-4">
          {sortedItems.map((item) => (
            <li key={item.id}>
              <Surface padding="none" className="min-w-0 overflow-hidden">
                <PreQuoteDraftItemCard item={item} />
              </Surface>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
