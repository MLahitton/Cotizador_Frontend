import assert from "node:assert/strict";
import test from "node:test";
import { formatPublicProjectType, formatPublicInstallationWindow } from "./project-public-context-formatters";

test("formats the public project type codes", () => {
  for (const [code, label] of Object.entries({
    apto: "Apartamento", edificio: "Edificio / propiedad horizontal",
    casa: "Casa en unidad residencial o parcelaci\u00f3n", hospedaje: "Hospedaje / renta corta",
    comercial: "Comercial, institucional o corporativo",
  })) assert.equal(formatPublicProjectType(code, "ignored"), label);
});

test("other uses useful text only", () => {
  assert.equal(formatPublicProjectType("otro", " Casa rural "), "Casa rural");
  assert.equal(formatPublicProjectType("otro", "  "), "Otro");
  assert.equal(formatPublicProjectType("otro", null), "Otro");
});

test("null, missing and unknown values have safe fallbacks", () => {
  for (const value of [null, undefined, "UNKNOWN", "", "toString"]) {
    assert.equal(formatPublicProjectType(value, "ignored"), "Por definir");
    assert.equal(formatPublicInstallationWindow(value), "Por definir");
  }
});

test("formats every installation window including undecided", () => {
  for (const [code, label] of Object.entries({
    lt2m: "Menos de 2 meses", "2-4m": "2\u20134 meses", "4-6m": "4\u20136 meses",
    "6-9m": "6\u20139 meses", "9-12m": "9\u201312 meses",
    gt12m: "M\u00e1s de 12 meses", nd: "A\u00fan no est\u00e1 definido",
  })) assert.equal(formatPublicInstallationWindow(code), label);
});
