import type { TechnicalProposalItem } from "@/features/prequotes/technical-proposal-types";
import type { ExperienceDimensionKey, ExperienceSelections, ItemExperienceDraft } from "@/features/prequotes/prequote-experience-types";

export interface ExperienceDimensionConfig {
  key: ExperienceDimensionKey;
  label: string;
  question: string;
  options: string[];
}

export const EXPERIENCE_DIMENSIONS: Record<ExperienceDimensionKey, ExperienceDimensionConfig> = {
  view: {
    key: "view",
    label: "Vista / diseno",
    question: "Que protagonismo quiere darle al vidrio?",
    options: ["Equilibrada", "Mas amplitud", "Maxima vista"],
  },
  tranquility: {
    key: "tranquility",
    label: "Tranquilidad",
    question: "Que nivel de tranquilidad necesita?",
    options: ["Estandar", "Menos ruido", "Alta tranquilidad", "Maxima prioridad"],
  },
  temperature: {
    key: "temperature",
    label: "Temperatura",
    question: "Que tan importante es mantenerla estable?",
    options: ["Estandar", "Mas estable", "Alto confort", "Maximo confort"],
  },
  solar: {
    key: "solar",
    label: "Solar / UV",
    question: "Que quiere proteger del sol?",
    options: ["Estandar", "Proteccion UV", "Control solar", "Alta proteccion"],
  },
  security: {
    key: "security",
    label: "Seguridad",
    question: "Que nivel de proteccion quiere?",
    options: ["Estandar", "Reforzada", "Alta"],
  },
  outdoorConnection: {
    key: "outdoorConnection",
    label: "Relacion exterior",
    question: "Como quiere relacionarse con el exterior?",
    options: ["Ocasional", "Frecuente", "Gran apertura", "Maxima conexion"],
  },
  airtightness: {
    key: "airtightness",
    label: "Hermeticidad",
    question: "Que proteccion necesita frente a lluvia, viento y aire?",
    options: ["Estandar", "Alta", "Exposicion critica"],
  },
  privacy: {
    key: "privacy",
    label: "Privacidad",
    question: "Que privacidad necesita sin perder calidad de luz?",
    options: ["Transparente", "Parcial", "Alta"],
  },
  threshold: {
    key: "threshold",
    label: "Umbral",
    question: "Que tan continua quiere la transicion hacia la terraza?",
    options: ["Convencional", "Mas limpio", "Lo mas continuo posible"],
  },
  insects: {
    key: "insects",
    label: "Insectos",
    question: "Necesita ventilar sin ingreso de insectos?",
    options: ["No", "Si"],
  },
  finish: {
    key: "finish",
    label: "Acabado",
    question: "Como quiere que la ventana dialogue con la arquitectura?",
    options: ["Neutro", "Integrado", "Protagonista"],
  },
};

const ALL_DIMENSIONS = Object.keys(EXPERIENCE_DIMENSIONS) as ExperienceDimensionKey[];

const SPACE_DIMENSIONS: Record<string, ExperienceDimensionKey[]> = {
  bedroom: ["tranquility", "temperature", "view", "privacy", "solar", "insects"],
  living: ["view", "outdoorConnection", "temperature", "solar", "airtightness", "security"],
  bathroom: ["privacy", "insects", "security", "temperature"],
  terraceDoor: ["view", "outdoorConnection", "threshold", "security", "airtightness", "finish"],
  fixedFacade: ["view", "temperature", "solar", "airtightness", "security"],
  kitchen: ["insects", "security", "temperature", "airtightness", "finish"],
  generic: ["view", "tranquility", "temperature", "security"],
};

const DEFAULT_VALUES: Record<ExperienceDimensionKey, string> = {
  view: "Maxima vista",
  tranquility: "Alta tranquilidad",
  temperature: "Alto confort",
  solar: "Control solar",
  security: "Reforzada",
  outdoorConnection: "Frecuente",
  airtightness: "Alta",
  privacy: "Parcial",
  threshold: "Mas limpio",
  insects: "Si",
  finish: "Integrado",
};

function containsAny(text: string, values: string[]): boolean {
  return values.some((value) => text.includes(value));
}

export function inferExperienceSpaceType(item: TechnicalProposalItem): string {
  const haystack = [
    item.reference,
    item.description,
    item.elementType,
    item.visualModel?.functionalType,
    item.visualModel?.operation,
    item.trace.functionalType,
    item.trace.operation,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (containsAny(haystack, ["alcoba", "habitacion", "dormitorio", "bedroom"])) return "bedroom";
  if (containsAny(haystack, ["sala", "estar", "living", "social"])) return "living";
  if (containsAny(haystack, ["bano", "baño", "shower", "ducha"])) return "bathroom";
  if (containsAny(haystack, ["terraza", "balcon", "balcón"]) && containsAny(haystack, ["puerta", "door"])) return "terraceDoor";
  if (containsAny(haystack, ["fachada", "facade"])) return "fixedFacade";
  if (containsAny(haystack, ["cocina", "kitchen"])) return "kitchen";
  if (containsAny(haystack, ["fijo", "fixed"])) return "fixedFacade";
  if (containsAny(haystack, ["puerta", "door"])) return "terraceDoor";

  return "generic";
}

export function formatExperienceSpaceType(spaceType: string): string {
  const labels: Record<string, string> = {
    bedroom: "Alcoba demo",
    living: "Sala / estar demo",
    bathroom: "Bano demo",
    terraceDoor: "Puerta terraza demo",
    fixedFacade: "Fachada fija demo",
    kitchen: "Cocina demo",
    generic: "Espacio generico demo",
  };

  return labels[spaceType] ?? labels.generic;
}

function emptySelections(): ExperienceSelections {
  return ALL_DIMENSIONS.reduce((values, key) => ({ ...values, [key]: null }), {} as ExperienceSelections);
}

export function createDefaultExperienceDraft(item: TechnicalProposalItem): ItemExperienceDraft {
  const spaceType = inferExperienceSpaceType(item);
  const relevantDimensions = SPACE_DIMENSIONS[spaceType] ?? SPACE_DIMENSIONS.generic;
  const selections = emptySelections();

  relevantDimensions.forEach((dimension) => {
    selections[dimension] = DEFAULT_VALUES[dimension];
  });

  return {
    itemId: item.itemId,
    spaceType,
    relevantDimensions,
    selections,
    wasReviewedByUser: false,
  };
}

export function mergeExperienceDraftWithItem(
  item: TechnicalProposalItem,
  existing: ItemExperienceDraft | undefined,
): ItemExperienceDraft {
  const defaults = createDefaultExperienceDraft(item);
  if (!existing) return defaults;

  return {
    ...defaults,
    ...existing,
    relevantDimensions: defaults.relevantDimensions,
    selections: {
      ...defaults.selections,
      ...existing.selections,
    },
  };
}

export function getExperienceSelectionsSummary(draft: ItemExperienceDraft, limit = 4): string[] {
  return draft.relevantDimensions
    .map((dimension) => draft.selections[dimension])
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .slice(0, limit);
}

export function getExperienceTrendCounts(drafts: ItemExperienceDraft[]): Array<{ value: string; count: number }> {
  const counts = new Map<string, number>();

  drafts.forEach((draft) => {
    draft.relevantDimensions.forEach((dimension) => {
      const value = draft.selections[dimension];
      if (!value) return;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, "es"));
}