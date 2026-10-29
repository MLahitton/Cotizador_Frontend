import { CalendarDays, ClipboardCheck, Factory, FileCheck2, FileSignature, Hammer, Headphones, Ruler, Truck, UserCheck } from "lucide-react";

// Presentation copy: existing short subtitles and approved expanded descriptions.
// These explain the journey; they do not assert workflow state or completed work.
export const projectMoments = [
  {
    title: "Legalización del proyecto", subtitle: "Firma de contrato y condiciones.", Icon: FileSignature,
    description: "En este momento se formaliza lo acordado para tu proyecto. Se revisan el alcance de la propuesta, los elementos incluidos y las condiciones que quedarán recogidas en el contrato. La firma deja una referencia común para acompañar el desarrollo del trabajo y consultar lo pactado durante las siguientes etapas.",
  },
  {
    title: "Asignación del equipo", subtitle: "Residente y acompañamiento técnico.", Icon: UserCheck,
    description: "Se define el equipo que acompañará tu proyecto y servirá como punto de contacto durante su desarrollo. Esta etapa permite organizar la coordinación y el acompañamiento técnico, para que sepas con quién resolver inquietudes y cómo comunicar la información necesaria para avanzar.",
  },
  {
    title: "Programación de toma de medidas", subtitle: "Coordinación en obra.", Icon: CalendarDays,
    description: "Se coordina la visita para revisar los espacios donde se instalarán los elementos del proyecto. Se acuerdan la disponibilidad y las condiciones de acceso a la obra, de manera que la toma de medidas pueda realizarse con la información y el acompañamiento necesarios. La fecha se mostrará cuando esté definida.",
  },
  {
    title: "Toma de medidas", subtitle: "Levantamiento técnico.", Icon: Ruler,
    description: "Durante la visita se verifican las dimensiones de los espacios y las condiciones que pueden influir en la instalación. Esta revisión permite contrastar la información de los planos con lo que existe en obra e identificar detalles que deban aclararse antes de continuar con la definición de los elementos.",
  },
  {
    title: "Acta de vanos", subtitle: "Validación y firma.", Icon: ClipboardCheck,
    description: "Se deja constancia de las medidas y observaciones correspondientes a los espacios donde irán las ventanas y puertas. Esta información se revisa y se formaliza mediante el acta de vanos, para contar con una referencia compartida sobre las dimensiones y condiciones consideradas para el proyecto.",
  },
  {
    title: "Producción", subtitle: "Fabricación de tus ventanas.", Icon: Factory,
    description: "Los elementos del proyecto toman forma a partir de las medidas y especificaciones aprobadas. Esta etapa comprende la preparación, fabricación y ensamble de los componentes, de acuerdo con la configuración definida para cada elemento. Las verificaciones de producción acompañan el proceso antes de pasar al despacho.",
  },
  {
    title: "Despacho", subtitle: "Coordinación logística.", Icon: Truck,
    description: "Se organiza la salida de los elementos y su traslado hacia la obra. La coordinación contempla la entrega y las condiciones de recepción, como el acceso y el espacio disponible para recibirlos. El propósito es que la llegada de los materiales esté articulada con la preparación de la instalación.",
  },
  {
    title: "Instalación", subtitle: "Montaje en obra.", Icon: Hammer,
    description: "Se realiza el montaje de los elementos en los espacios definidos para el proyecto. Durante esta etapa se atienden las condiciones reales de la obra y los ajustes propios de la instalación, tomando como referencia las especificaciones acordadas. También se revisan los aspectos de funcionamiento y terminación que correspondan.",
  },
  {
    title: "Acta de entrega", subtitle: "Finalización y firma.", Icon: FileCheck2,
    description: "Se revisa el trabajo realizado y se deja constancia de la entrega del proyecto. Este momento permite registrar las observaciones que correspondan y formalizar mediante el acta el estado de los elementos entregados. Su firma documenta lo revisado y los acuerdos que queden consignados.",
  },
  {
    title: "Postventa", subtitle: "Acompañamiento y garantía.", Icon: Headphones,
    description: "Después de la entrega, este espacio acompaña las consultas sobre uso, cuidado y funcionamiento de los elementos instalados. Las solicitudes de atención y garantía se revisan según las condiciones acordadas para el proyecto. El alcance, los plazos y las coberturas aplicables son los establecidos en la documentación correspondiente.",
  },
] as const;

export type MomentsViewState = { selected: number; list: boolean };
export type MomentsViewAction = { type: "select"; index: number } | { type: "previous" | "next" | "toggleView" };
export const initialMomentsView: MomentsViewState = { selected: 0, list: false };

export function momentsViewReducer(state: MomentsViewState, action: MomentsViewAction): MomentsViewState {
  if (action.type === "toggleView") return { ...state, list: !state.list };
  const index = action.type === "select" ? action.index : state.selected + (action.type === "next" ? 1 : -1);
  return Number.isInteger(index) && index >= 0 && index < projectMoments.length ? { ...state, selected: index } : state;
}

export function momentNumber(index: number) { return String(index + 1).padStart(2, "0"); }

// This screen currently has no per-moment date/duration source. Never substitute
// project creation dates, a global installation window or an inferred duration.
export const momentPlanning = {
  date: "Por definir",
  duration: "Por definir",
  dateExplanation: "La fecha requerida no está disponible en esta sección.",
  durationExplanation: "La duración del proyecto no está disponible en esta sección.",
};

export type JourneyAnchor = { x: number; y: number; bottom: number };
export function journeyConnections(anchors: JourneyAnchor[], width: number): string[] {
  return anchors.slice(1).map((end, index) => {
    const start = anchors[index];
    if (Math.abs(start.y - end.y) < 2) return `M ${start.x} ${start.y} H ${end.x}`;
    if (Math.abs(start.x - end.x) < 2) return `M ${start.x} ${start.y} V ${end.y}`;
    // Connect the end of a row to the start of the next row. Route through
    // the free middle corridor, never straight down to the node below 05.
    const right = width - 8;
    const left = 8;
    const rowBottom = Math.max(...anchors.filter((anchor) => Math.abs(anchor.y - start.y) < 2).map((anchor) => anchor.bottom));
    const gap = (rowBottom + end.y) / 2;
    const rightRadius = Math.max(0, Math.min(40, (right - start.x) / 2));
    const leftRadius = Math.max(0, Math.min(32, (end.x - left) / 2));
    return `M ${start.x} ${start.y} H ${right - rightRadius} C ${right} ${start.y} ${right} ${gap} ${right - rightRadius} ${gap} H ${left + leftRadius} C ${left} ${gap} ${left} ${end.y} ${left + leftRadius} ${end.y} H ${end.x}`;
  });
}

export function detailScrollTarget(top: number, bottom: number, viewport: number, headerBottom: number, scrollY: number): number | null {
  const safeTop = Math.max(0, headerBottom) + 16;
  const safeBottom = viewport - 16;
  if (top >= safeTop && bottom <= safeBottom) return null;
  if (top < safeTop || bottom - top > safeBottom - safeTop) return Math.max(0, scrollY + top - safeTop);
  return Math.max(0, scrollY + bottom - safeBottom);
}
