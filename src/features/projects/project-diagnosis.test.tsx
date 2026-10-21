import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { isProjectDiagnosisResponse, type ProjectDiagnosisEntry, type ProjectDiagnosisResponse } from "./project-diagnosis-types";
import { ProjectDiagnosisView } from "./components/project-diagnosis-step";
import { DiagnosisScaleIndicator } from "./components/diagnosis-scale-indicator";
import { getProjectDiagnosis } from "./project-diagnosis-api";

function entry(overrides: Partial<ProjectDiagnosisEntry> = {}): ProjectDiagnosisEntry {
  return { questionId: "tipo", displayLabel: "Tipo de proyecto", availability: "AVAILABLE",
    code: "casa", codes: null, numericValue: null, textValue: null, displayValue: "Casa",
    displayValues: null, ...overrides };
}
function fixture(): Extract<ProjectDiagnosisResponse, { status: "AVAILABLE" }> {
  return { status: "AVAILABLE", diagnosis: { source: "SNG_WEB", submissionId: "test",
    schemaVersion: "sng-public-experience-v1", interpretationVersion: "diagnosis-v1",
    general: [entry()],
    priorities: [entry({ questionId: "termico", displayLabel: "Confort térmico", code: null, numericValue: 5, displayValue: "5 de 5" })],
    preferences: [entry({ questionId: "preferencia_acabado", displayLabel: "Acabado", code: "negro", displayValue: "Negro" })],
    livingContext: [entry({ questionId: "habitantes", displayLabel: "Usuarios", code: null, codes: ["ninos", "mascotas"], displayValue: null, displayValues: ["Niños", "Mascotas"] })],
    needs: [], decision: [], supplementalNotes: [] } };
}
const render = (data: ProjectDiagnosisResponse) => renderToStaticMarkup(createElement(ProjectDiagnosisView, {
  state: { status: "success", data }, onRetry() {},
}));

test("guard accepts the complete typed contract and nullable diagnosis statuses", () => {
  assert.ok(isProjectDiagnosisResponse(fixture()));
  for (const status of ["NO_PUBLIC_EXPERIENCE", "AMBIGUOUS_PUBLIC_EXPERIENCE", "UNSUPPORTED_SCHEMA", "INVALID_SOURCE_DATA"]) {
    assert.ok(isProjectDiagnosisResponse({ status, diagnosis: null }));
    assert.ok(!isProjectDiagnosisResponse({ status, diagnosis: fixture().diagnosis }));
  }
  assert.ok(!isProjectDiagnosisResponse({ status: "AVAILABLE", diagnosis: null }));
});
test("guard rejects invalid status, metadata and missing sections", () => {
  assert.ok(!isProjectDiagnosisResponse({ ...fixture(), status: "FUTURE" }));
  for (const key of Object.keys(fixture().diagnosis)) {
    const value = structuredClone(fixture());
    Reflect.deleteProperty(value.diagnosis, key);
    assert.ok(!isProjectDiagnosisResponse(value), key);
  }
});
test("guard rejects unknown availability and malformed typed values", () => {
  for (const change of [{ availability: "FUTURE" }, { availability: ["AVAILABLE"] }, { numericValue: "5" }, { numericValue: NaN }, { codes: [1] },
    { displayValues: [false] }, { textValue: {} }, { displayLabel: "" }, { displayValue: null },
    { code: 10 }, { questionId: null }]) {
    const value = fixture();
    Object.assign(value.diagnosis.general[0], change);
    assert.ok(!isProjectDiagnosisResponse(value), JSON.stringify(change));
  }
});
test("guard accepts safe unknown codes and rejects duplicate question ids", () => {
  const value = fixture();
  value.diagnosis.general = [entry({ availability: "UNKNOWN_CODE", code: "future", displayValue: "Valor no reconocido" })];
  assert.ok(isProjectDiagnosisResponse(value));
  value.diagnosis.general.push(value.diagnosis.general[0]);
  assert.ok(!isProjectDiagnosisResponse(value));
});
test("complete UI preserves scales, commercial finish and compact multiple answers", () => {
  const html = render(fixture());
  for (const text of ["Casa", "5 de 5", "Negro", "Niños", "Mascotas", "Información general", "Prioridades del cliente", "Información recibida"]) assert.ok(html.includes(text), text);
  for (const text of ["PP13", "BLACK_MATTE", "PREMIUM", "LAMINADO", "LOW", "<input", "<select", "<textarea", "diagnosis-v1", "sng-public-experience-v1"]) assert.ok(!html.includes(text), text);
  assert.match(html, /aria-labelledby="diagnosis-priorities"/);
});
for (const [status, expected] of [
  ["NO_PUBLIC_EXPERIENCE", "Este proyecto no tiene un diagnóstico"],
  ["AMBIGUOUS_PUBLIC_EXPERIENCE", "No fue posible determinar un único diagnóstico"],
  ["UNSUPPORTED_SCHEMA", "todavía no puede interpretarse"],
  ["INVALID_SOURCE_DATA", "No fue posible interpretar la información original"],
] as const) {
  test("UI status " + status + " is not an HTTP error and offers no retry", () => {
    const html = render({ status, diagnosis: null });
    assert.ok(html.includes(expected));
    assert.ok(!html.includes("Reintentar"));
    assert.ok(!html.includes('role="alert"'));
  });
}
test("HTTP error offers retry; loading is announced", () => {
  const html = renderToStaticMarkup(createElement(ProjectDiagnosisView, { state: { status: "error", data: null }, onRetry() {} }));
  assert.ok(html.includes("No fue posible cargar el diagnóstico."));
  assert.ok(html.includes("Reintentar"));
  const loading = renderToStaticMarkup(createElement(ProjectDiagnosisView, { state: { status: "loading", data: null }, onRetry() {} }));
  assert.ok(loading.includes('role="status"'));
});
test("availability keeps missing fields and sections visible and hides only inapplicable entries", () => {
  const value = fixture();
  value.diagnosis.general.push(entry({ questionId: "tipo_otro", displayLabel: "HIDDEN_CONDITIONAL", availability: "NOT_APPLICABLE", displayValue: null }));
  value.diagnosis.general.push(entry({ questionId: "ciudad", displayLabel: "Ciudad", availability: "NOT_PROVIDED", displayValue: null }));
  value.diagnosis.needs.push(entry({ availability: "NOT_PROVIDED", displayValue: null }));
  value.diagnosis.decision.push(entry({ availability: "UNKNOWN_CODE", displayValue: "Valor no reconocido", code: "RAW_UNKNOWN" }));
  value.diagnosis.supplementalNotes.push(entry({ availability: "INVALID_VALUE", displayValue: "bad" }));
  const html = render(value);
  assert.ok(!html.includes("HIDDEN_CONDITIONAL"));
  assert.ok(html.includes('id="diagnosis-needs"'));
  assert.ok(!html.includes("RAW_UNKNOWN"));
  for (const text of ["Sin información", "Valor no reconocido", "Información no válida"]) assert.ok(html.includes(text));
});
test("every NOT_PROVIDED entry stays visible even when every section is unanswered", () => {
  const value = fixture();
  const sections = ["general", "priorities", "preferences", "livingContext", "needs", "decision", "supplementalNotes"] as const;
  for (const key of sections) {
    value.diagnosis[key] = [entry({ questionId: key, displayLabel: "Missing " + key, availability: "NOT_PROVIDED", displayValue: null })];
  }
  const html = render(value);
  assert.equal(html.match(/Sin información/g)?.length, sections.length);
  for (const key of sections) {
    assert.ok(html.includes('id="diagnosis-' + key + '"'));
    assert.ok(html.includes("Missing " + key));
  }
});
test("scales retain the original 1-5 number with five visual nodes and an accessible label", () => {
  for (const value of [1, 2, 3, 4, 5]) {
    const html = renderToStaticMarkup(createElement(DiagnosisScaleIndicator, { value, label: "Confort térmico" }));
    assert.ok(html.includes('aria-label="Confort térmico: ' + value + ' de 5"'));
    assert.equal(html.match(/rounded-full/g)?.length, 5);
    assert.equal(html.match(/border-accent bg-accent/g)?.length, value);
    assert.ok(!html.includes("slider"));
  }
});
test("UV stays a textual answer for yes, no and unknown, never a scale or an editable control", () => {
  for (const [code, displayValue] of [["si", "Sí"], ["no", "No"], ["ns", "No estoy seguro"]]) {
    const value = fixture();
    value.diagnosis.priorities = [entry({ questionId: "uv", displayLabel: "Protección UV", code, displayValue })];
    const html = render(value);
    assert.ok(html.includes(displayValue));
    assert.ok(!html.includes('role="img"'));
    assert.ok(!html.includes("<input"));
  }
});
test("free text renders escaped and retains line breaks", () => {
  const value = fixture();
  value.diagnosis.needs.push(entry({ textValue: "<script>alert(1)</script>\nSegunda línea", displayValue: "<script>alert(1)</script>\nSegunda línea" }));
  const html = render(value);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;script&gt;"));
  assert.ok(html.includes("\nSegunda línea"));
  assert.ok(html.includes("whitespace-pre-wrap"));
});
test("API uses the authenticated GET contract and rejects malformed responses", async () => {
  const oldFetch = globalThis.fetch;
  const oldUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://diagnosis.test";
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), "http://diagnosis.test/api/v2/projects/project%20id/diagnosis");
      assert.equal(options?.method, "GET");
      assert.equal(options?.body, undefined);
      return Response.json(fixture());
    };
    assert.deepEqual(await getProjectDiagnosis("project id"), fixture());
    globalThis.fetch = async () => Response.json({ status: "AVAILABLE", diagnosis: null });
    await assert.rejects(getProjectDiagnosis("project id"), { name: "ApiError", status: 0 });
    globalThis.fetch = async () => Response.json({}, { status: 503 });
    await assert.rejects(getProjectDiagnosis("project id"), { name: "ApiError", status: 503 });
  } finally {
    globalThis.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = oldUrl;
  }
});
