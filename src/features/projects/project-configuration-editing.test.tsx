import assert from "node:assert/strict";
import test from "node:test";
import { Children, createElement, isValidElement, type ComponentProps, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ConfigurationItemCard, ExperienceConfigurationConfirmationPanel } from "./components/project-configuration-step";
import { canConfirmConfiguration, hasPendingConfigurationChanges, type ConfigurationDraftStatus } from "./project-configuration-editing";

const ready = { readOnly: false, confirming: false, hasPendingChanges: false, inclusionBusy: false, dataReady: true, canConfirm: true };

test("confirmation requires persisted changes, loaded data and the existing server permission", () => {
  assert.equal(canConfirmConfiguration(ready), true);
  for (const key of ["readOnly", "confirming", "hasPendingChanges", "inclusionBusy"] as const) {
    assert.equal(canConfirmConfiguration({ ...ready, [key]: true }), false, key);
  }
  for (const key of ["dataReady", "canConfirm"] as const) {
    assert.equal(canConfirmConfiguration({ ...ready, [key]: false }), false, key);
  }
});

test("unsaved, failed and conflicting drafts block confirmation even outside the visible page", () => {
  for (const status of ["dirty", "saving", "error", "conflict"] satisfies ConfigurationDraftStatus[]) {
    const statuses = { visible: "saved" as const, anotherPageOrExcludedItem: status };
    const original = { ...statuses };
    assert.equal(canConfirmConfiguration({ ...ready, hasPendingChanges: hasPendingConfigurationChanges(statuses) }), false);
    assert.deepEqual(statuses, original);
  }
  assert.equal(hasPendingConfigurationChanges({ a: "idle", b: "saved" }), false);
  assert.equal(hasPendingConfigurationChanges({}), false);
});

type CardProps = ComponentProps<typeof ConfigurationItemCard>;
function card(overrides: Partial<CardProps> = {}): CardProps {
  return {
    item: {
      itemId: "item-1", reference: "V-01", sequence: 1, description: "Descripción larga ".repeat(20),
      isIncluded: true, source: "AI_EXTRACTED", effectiveWidthMm: 1200, effectiveHeightMm: 1500,
      effectiveQuantity: 2, areaM2: 1.8, quantitySource: "EXTRACTED", quantityExtractionStatus: null,
      quantityExtractionConfidence: null, effectiveLocation: "Ubicación larga ".repeat(10),
      extractedItemId: "extracted-1", elementId: null, elementType: "Ventana", quantity: 2, widthMm: 1200, heightMm: 1500,
      manualQuantityOverride: null, manualWidthMmOverride: null, manualHeightMmOverride: null,
      excludedAtUtc: null, excludedByUserId: null, exclusionReason: null, extractionConfidence: null, extractionStatus: null,
      manualNote: null, manualObservation: null, suggested: { system: null, glass: null, finish: null }, selected: null,
      selectionState: "UNCONFIRMED", alternatives: { systems: [], glass: [], finishes: [] },
      confidence: { overall: 0, system: 0, glass: 0, finish: 0 }, requiresReview: false, reviewReasons: [],
      systemResolutionReasons: [], glassResolutionReasons: [], finishResolutionReasons: [], isTechnicallyComplete: true, isPriceable: true,
      readiness: { state: "READY", blockingCount: 0, warningCount: 0, pendingDefinitions: [] },
      historicalEvidence: { status: "NO_COMPARABLES", supportCount: 0, bestSimilarity: null, averageSimilarity: null, examples: [] },
      visualModel: null, trace: { functionalType: "Ventana", requestedSystemRaw: null, requestedProfileRaw: null, operation: null,
        glassRawSpecification: null, glassTypeRaw: null, glassTypeNormalized: null, glassThicknessMm: null,
        finishRawDescription: null, finishNormalizedType: null, finishColorRaw: null, finishColorNormalized: null,
        specialFeatures: [], geometryType: null },
      dataCompleteness: { state: "COMPLETE", isComplete: true, missingFields: [] }, evidence: [],
      occurrenceContext: null, extractedLocation: null, manualLocationOverride: null,
    },
    catalog: { version: "1", spaces: [], questions: [{ benefitCode: "benefit", label: "Prioridad", question: "Prioridad", options: [
      { optionCode: "LOW", optionLabel: "Etiqueta completa sin abreviar", shortLabel: null, conditions: [] },
      { optionCode: "MEDIUM", optionLabel: "Media", shortLabel: null, conditions: [] },
      { optionCode: "HIGH", optionLabel: "Alta", shortLabel: null, conditions: [] },
    ] }] },
    draft: { itemId: "item-1", answers: {}, revision: 0, catalogVersion: "1", spaceTypeCode: null,
      resolutionState: "PENDING", updatedAtUtc: null, updatedByUserId: null, level1Resolution: null, hasServerDraft: false },
    status: "dirty", error: null, inclusionError: null, inclusionBusy: false, readOnly: false, confirming: false,
    onDraftChange() {}, onSaveDraft() {}, onToggleInclusion() {}, onOpenItem() {}, ...overrides,
  };
}

function visit(node: ReactNode, callback: (props: Record<string, unknown>) => void) {
  Children.forEach(node, (child) => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return;
    callback(child.props);
    visit(child.props.children, callback);
  });
}

test("readOnly and confirmation in progress disable mutations and guard card callbacks while preserving detail", () => {
  for (const overrides of [{ readOnly: true }, { confirming: true }]) {
    const calls: string[] = [];
    const props = card({ ...overrides, onDraftChange: () => calls.push("draft"), onSaveDraft: () => calls.push("save"),
      onToggleInclusion: () => calls.push("include"), onOpenItem: () => calls.push("detail") });
    visit(ConfigurationItemCard(props), (element) => {
      if (typeof element.onSelect === "function") {
        assert.equal(element.disabled, true);
        element.onSelect("HIGH");
      }
      if (element.children === "Guardar prioridades" || element.children === "Excluir") {
        assert.equal(element.disabled, true);
        (element.onClick as () => void)();
      }
      if (typeof element["aria-label"] === "string" && element["aria-label"].startsWith("Abrir detalle")) {
        (element.onClick as () => void)();
      }
    });
    assert.ok(calls.length > 0);
    assert.ok(calls.every((call) => call === "detail"));
  }
});

test("editable card keeps existing preference, inclusion and save actions", () => {
  const calls: string[] = [];
  visit(ConfigurationItemCard(card({ onDraftChange: () => calls.push("draft"), onSaveDraft: () => calls.push("save"),
    onToggleInclusion: () => calls.push("include") })), (element) => {
    if (typeof element.onSelect === "function") element.onSelect("HIGH");
    if (element.children === "Guardar prioridades" || element.children === "Excluir") (element.onClick as () => void)();
  });
  assert.deepEqual(calls, ["draft", "include", "save"]);
});

test("missing preview and long descriptions, options and errors remain in rendered content", () => {
  const props = card({ status: "conflict", error: "Conflicto de guardado ".repeat(20) });
  const html = renderToStaticMarkup(createElement(ConfigurationItemCard, props));
  for (const value of [props.item.description, props.item.effectiveLocation!.trim(), props.error!, "Vista previa no disponible", "Etiqueta completa sin abreviar"]) {
    assert.ok(html.includes(value), value);
  }
});

test("the existing visual review caption is rendered inside the configuration preview", () => {
  const props = card();
  props.item.visualModel = { version: "1", source: "test", system: null, functionalType: "Ventana", operation: null,
    geometryType: null, widthMm: 1200, heightMm: 1500, quantity: 2, divisions: [], specialFeatures: [],
    requiresReview: true, reviewReasons: [], panels: [{ index: 1, kind: "SIMPLE", role: "FIXED", operation: null,
      widthMm: 1200, heightMm: 1500, widthRatio: 1, heightRatio: 1, isMovable: false, openingDirection: null,
      confidence: null, subPanels: [] }] };
  const html = renderToStaticMarkup(createElement(ConfigurationItemCard, props));
  assert.match(html, /<figcaption>.*Revisión visual/);
  assert.ok(!html.includes("[&amp;_figcaption]:hidden"));
  assert.match(html, /preserveAspectRatio="xMidYMid meet"/);
});

test("server confirmation is distinguished from unsaved local changes, and readOnly offers no confirmation action", () => {
  const props: ComponentProps<typeof ExperienceConfigurationConfirmationPanel> = {
    projectId: "project", configuration: { technicalProposalId: "proposal", status: "CONFIRMED", canConfirm: true,
      latestConfirmationRevision: 2, confirmedAtUtc: null, confirmedByUserId: null, reviewReasons: [], blockingReasons: [], items: [] },
    state: "success", confirming: false, notice: null, error: null, onConfirm() {}, onRetry() {},
    readOnly: false, hasPendingChanges: true, confirmationAllowed: false,
  };
  const html = renderToStaticMarkup(createElement(ExperienceConfigurationConfirmationPanel, props));
  assert.ok(html.includes('id="experience-configuration-unsaved"'));
  const readOnly = renderToStaticMarkup(createElement(ExperienceConfigurationConfirmationPanel, {
    ...props, readOnly: true, configuration: { ...props.configuration!, status: "DRAFT" },
  }));
  assert.ok(!readOnly.includes("<button"));
});
