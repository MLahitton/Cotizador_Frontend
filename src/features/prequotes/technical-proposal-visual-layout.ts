import type { VisualPanel, VisualSystemModel } from "@/features/prequotes/technical-proposal-types";

export interface VisualPanelLayout {
  panel: VisualPanel;
  x: number;
  y: number;
  width: number;
  height: number;
  children: VisualPanelLayout[];
}

export interface VisualCanvasLayout {
  width: number;
  height: number;
  frame: { x: number; y: number; width: number; height: number };
  panels: VisualPanelLayout[];
}

const MAX_CANVAS_WIDTH = 600;
const MIN_CANVAS_WIDTH = 260;
const FRAME_PADDING = 24;
const MIN_CONTENT_HEIGHT = 88;
const MAX_CONTENT_HEIGHT = 380;

function positive(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value > 0 ? value : null;
}

function weights(
  panels: VisualPanel[],
  ratio: (panel: VisualPanel) => number | null,
  millimeters: (panel: VisualPanel) => number | null,
  totalMillimeters: number | null,
): number[] {
  const equal = 1 / panels.length;
  const raw = panels.map((panel) => {
    const explicitRatio = positive(ratio(panel));
    if (explicitRatio !== null) return explicitRatio;
    const size = positive(millimeters(panel));
    if (size !== null && positive(totalMillimeters) !== null) return size / totalMillimeters!;
    return equal;
  });
  const total = raw.reduce((sum, value) => sum + value, 0);
  return raw.map((value) => value / total);
}

function layoutVertical(panels: VisualPanel[], x: number, y: number, width: number, height: number, parentHeightMm: number | null): VisualPanelLayout[] {
  if (panels.length === 0) return [];
  const panelWeights = weights(panels, (panel) => panel.heightRatio, (panel) => panel.heightMm, parentHeightMm);
  let cursor = y;
  return panels.map((panel, index) => {
    const panelHeight = index === panels.length - 1 ? y + height - cursor : height * panelWeights[index];
    const layout: VisualPanelLayout = {
      panel,
      x,
      y: cursor,
      width,
      height: panelHeight,
      children: layoutVertical(panel.subPanels, x, cursor, width, panelHeight, panel.heightMm ?? parentHeightMm),
    };
    cursor += panelHeight;
    return layout;
  });
}

export function createVisualCanvasLayout(model: VisualSystemModel): VisualCanvasLayout {
  const physicalWidth = positive(model.widthMm) ?? 1600;
  const physicalHeight = positive(model.heightMm) ?? 1000;
  const aspectRatio = physicalWidth / physicalHeight;
  let contentWidth = MAX_CANVAS_WIDTH - FRAME_PADDING * 2;
  let contentHeight = contentWidth / aspectRatio;
  if (contentHeight > MAX_CONTENT_HEIGHT) {
    contentHeight = MAX_CONTENT_HEIGHT;
    contentWidth = contentHeight * aspectRatio;
  }
  const canvasWidth = Math.max(MIN_CANVAS_WIDTH, Math.min(MAX_CANVAS_WIDTH, contentWidth + FRAME_PADDING * 2));
  const canvasHeight = Math.max(MIN_CONTENT_HEIGHT, contentHeight) + FRAME_PADDING * 2;
  const frame = {
    x: (canvasWidth - contentWidth) / 2,
    y: (canvasHeight - contentHeight) / 2,
    width: contentWidth,
    height: contentHeight,
  };
  const panelWeights = weights(model.panels, (panel) => panel.widthRatio, (panel) => panel.widthMm, model.widthMm);
  let cursor = frame.x;
  const panels = model.panels.map((panel, index) => {
    const width = index === model.panels.length - 1 ? frame.x + frame.width - cursor : frame.width * panelWeights[index];
    const layout: VisualPanelLayout = {
      panel,
      x: cursor,
      y: frame.y,
      width,
      height: frame.height,
      children: layoutVertical(panel.subPanels, cursor, frame.y, width, frame.height, panel.heightMm ?? model.heightMm),
    };
    cursor += width;
    return layout;
  });
  return { width: canvasWidth, height: canvasHeight, frame, panels };
}
