import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { createVisualCanvasLayout, type VisualPanelLayout } from "@/features/prequotes/technical-proposal-visual-layout";
import type { VisualDivision, VisualPanel, VisualSystemModel } from "@/features/prequotes/technical-proposal-types";

const FRAME_PROFILE = 5;

function clearDirection(value: string | null): "LEFT" | "RIGHT" | null {
  const normalized = value?.trim().toUpperCase();
  if (normalized?.includes("LEFT") || normalized?.includes("IZQUIERD")) return "LEFT";
  if (normalized?.includes("RIGHT") || normalized?.includes("DERECH")) return "RIGHT";
  return null;
}

function panelInset(layout: VisualPanelLayout): number {
  return Math.max(3, Math.min(7, Math.min(layout.width, layout.height) * 0.08));
}

function panelSymbol(panel: VisualPanel, layout: VisualPanelLayout): ReactNode {
  const { x, y, width, height } = layout;
  const inset = panelInset(layout) + 3;
  const left = x + inset;
  const right = x + width - inset;
  const top = y + inset;
  const bottom = y + height - inset;
  const middleX = x + width / 2;
  const middleY = y + height / 2;
  const role = panel.role;
  if (role === "FIXED" || role === "UNKNOWN" || role === "COMPOSITE" || right <= left || bottom <= top) return null;

  if (role === "PROJECTING") {
    return <path d={`M ${left} ${bottom} L ${middleX} ${top} L ${right} ${bottom}`} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  }

  if (role === "SLIDING") {
    const direction = clearDirection(panel.openingDirection);
    const arrowSize = Math.max(3, Math.min(7, width * 0.09));
    const arrow = direction === "LEFT"
      ? `M ${right} ${middleY} H ${left} M ${left} ${middleY} l ${arrowSize} -${arrowSize * 0.7} M ${left} ${middleY} l ${arrowSize} ${arrowSize * 0.7}`
      : direction === "RIGHT"
        ? `M ${left} ${middleY} H ${right} M ${right} ${middleY} l -${arrowSize} -${arrowSize * 0.7} M ${right} ${middleY} l -${arrowSize} ${arrowSize * 0.7}`
        : `M ${left} ${middleY} H ${right} M ${middleX - arrowSize} ${middleY - arrowSize * 0.7} L ${middleX} ${middleY} L ${middleX - arrowSize} ${middleY + arrowSize * 0.7} M ${middleX + arrowSize} ${middleY - arrowSize * 0.7} L ${middleX} ${middleY} L ${middleX + arrowSize} ${middleY + arrowSize * 0.7}`;
    return <g><path d={arrow} fill="none" strokeLinecap="round" strokeLinejoin="round" /><line x1={middleX} y1={top} x2={middleX} y2={bottom} opacity="0.45" /></g>;
  }

  if (role === "HINGED") {
    const direction = clearDirection(panel.openingDirection);
    if (direction === "LEFT") return <path d={`M ${left} ${top} L ${right} ${middleY} L ${left} ${bottom} M ${left} ${top} Q ${middleX} ${middleY} ${left} ${bottom}`} fill="none" strokeLinecap="round" />;
    if (direction === "RIGHT") return <path d={`M ${right} ${top} L ${left} ${middleY} L ${right} ${bottom} M ${right} ${top} Q ${middleX} ${middleY} ${right} ${bottom}`} fill="none" strokeLinecap="round" />;
    return <path d={`M ${left} ${top} L ${middleX} ${middleY} L ${left} ${bottom} M ${right} ${top} L ${middleX} ${middleY} L ${right} ${bottom}`} fill="none" strokeLinecap="round" />;
  }

  if (role === "FOLDING") {
    const firstFold = x + width * 0.36;
    const secondFold = x + width * 0.64;
    return <g><path d={`M ${left} ${middleY} L ${firstFold} ${top} L ${middleX} ${middleY} L ${secondFold} ${bottom} L ${right} ${middleY}`} fill="none" strokeLinecap="round" strokeLinejoin="round" /><circle cx={firstFold} cy={top} r="1.7" fill="currentColor" stroke="none" /><circle cx={secondFold} cy={bottom} r="1.7" fill="currentColor" stroke="none" /></g>;
  }

  if (role === "LOUVER") {
    const count = Math.max(3, Math.min(7, Math.floor((bottom - top) / 10)));
    const lines = Array.from({ length: count }, (_, index) => top + (index + 1) * (bottom - top) / (count + 1));
    return <>{lines.map((lineY) => <line key={lineY} x1={left} y1={lineY} x2={right} y2={lineY} strokeLinecap="round" />)}</>;
  }

  return null;
}

function RenderPanel({ layout, path }: { layout: VisualPanelLayout; path: string }) {
  const { panel, x, y, width, height, children } = layout;
  const inset = panelInset(layout);
  const glassWidth = Math.max(0, width - inset * 2);
  const glassHeight = Math.max(0, height - inset * 2);
  return <g data-panel-path={path} data-panel-role={panel.role}>
    {glassWidth > 0 && glassHeight > 0 ? <rect x={x + inset} y={y + inset} width={glassWidth} height={glassHeight} rx="1" fill="var(--sng-color-brand-soft)" fillOpacity="0.42" stroke="var(--sng-color-border-strong)" strokeWidth="1" /> : null}
    <rect x={x} y={y} width={width} height={height} fill="none" stroke="var(--sng-color-text-secondary)" strokeWidth={children.length > 0 ? 1.6 : 1.35} />
    {children.length > 0
      ? children.map((child, index) => <RenderPanel key={`${path}-${child.panel.index}-${index}`} layout={child} path={`${path}.${child.panel.index}`} />)
      : <g stroke="var(--sng-color-text-secondary)" strokeWidth="1.35">{panelSymbol(panel, layout)}</g>}
  </g>;
}

function divisionLine(division: VisualDivision, model: VisualSystemModel, frame: { x: number; y: number; width: number; height: number }, index: number): ReactNode {
  const orientation = division.orientation.trim().toUpperCase();
  if (orientation === "VERTICAL") {
    const ratio = division.positionRatio ?? (division.positionMm !== null && model.widthMm ? division.positionMm / model.widthMm : null);
    if (ratio === null || ratio <= 0 || ratio >= 1) return null;
    const x = frame.x + frame.width * ratio;
    return <line key={`division-${index}`} x1={x} y1={frame.y + FRAME_PROFILE} x2={x} y2={frame.y + frame.height - FRAME_PROFILE} stroke="var(--sng-color-border-interactive)" strokeWidth="1.1" />;
  }
  if (orientation === "HORIZONTAL") {
    const ratio = division.positionRatio ?? (division.positionMm !== null && model.heightMm ? division.positionMm / model.heightMm : null);
    if (ratio === null || ratio <= 0 || ratio >= 1) return null;
    const y = frame.y + frame.height * ratio;
    return <line key={`division-${index}`} x1={frame.x + FRAME_PROFILE} y1={y} x2={frame.x + frame.width - FRAME_PROFILE} y2={y} stroke="var(--sng-color-border-interactive)" strokeWidth="1.1" />;
  }
  return null;
}

function ariaLabel(model: VisualSystemModel): string {
  const identity = model.system?.displayName ?? model.functionalType ?? "sistema sin identificar";
  const dimensions = model.widthMm && model.heightMm ? `${model.widthMm} por ${model.heightMm} milímetros` : "dimensiones no disponibles";
  return `Vista técnica de ${identity}, ${dimensions}, cantidad ${model.quantity ?? 1}`;
}

export function TechnicalProposalVisualPreview({ visualModel }: { visualModel: VisualSystemModel | null }) {
  if (!visualModel || visualModel.panels.length === 0) {
    return <div className="flex min-h-32 items-center justify-center rounded-md border border-border-subtle bg-surface-subtle p-4 text-sm text-foreground-secondary">Vista previa no disponible</div>;
  }
  const layout = createVisualCanvasLayout(visualModel);
  const isCorner = visualModel.geometryType?.trim().toUpperCase() === "CORNER";
  return <figure className="min-w-0 space-y-2">
    <div className="overflow-hidden rounded-md border border-border-subtle bg-surface-subtle p-3 text-foreground shadow-xs sm:p-4">
      <svg role="img" aria-label={ariaLabel(visualModel)} viewBox={`0 0 ${layout.width} ${layout.height}`} preserveAspectRatio="xMidYMid meet" className="mx-auto h-auto max-h-80 w-full" fill="none" stroke="currentColor">
        <rect x={layout.frame.x} y={layout.frame.y} width={layout.frame.width} height={layout.frame.height} rx="1" fill="var(--sng-color-brand-soft)" fillOpacity="0.24" stroke="var(--sng-color-text-primary)" strokeWidth="4" />
        <rect x={layout.frame.x + FRAME_PROFILE} y={layout.frame.y + FRAME_PROFILE} width={Math.max(0, layout.frame.width - FRAME_PROFILE * 2)} height={Math.max(0, layout.frame.height - FRAME_PROFILE * 2)} rx="0.5" fill="none" stroke="var(--sng-color-border-interactive)" strokeWidth="1.25" />
        {layout.panels.map((panel, index) => <RenderPanel key={`${panel.panel.index}-${index}`} layout={panel} path={String(panel.panel.index)} />)}
        {visualModel.divisions.map((division, index) => divisionLine(division, visualModel, layout.frame, index))}
        <rect x={layout.frame.x} y={layout.frame.y} width={layout.frame.width} height={layout.frame.height} rx="1" fill="none" stroke="var(--sng-color-text-primary)" strokeWidth="4" />
        {isCorner ? <g><path d={`M ${layout.frame.x + 10} ${layout.frame.y + 24} V ${layout.frame.y + 10} H ${layout.frame.x + 24}`} stroke="var(--sng-color-warning)" strokeWidth="2" strokeLinecap="round" /><text x={layout.frame.x + 30} y={layout.frame.y + 17} fill="var(--sng-color-warning)" stroke="none" fontSize="10" fontWeight="600" letterSpacing="0.8">CORNER</text></g> : null}
      </svg>
    </div>
    {visualModel.requiresReview ? <figcaption><Badge tone="warning" size="sm">Revisión visual</Badge></figcaption> : null}
  </figure>;
}
