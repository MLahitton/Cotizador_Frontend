import assert from "node:assert/strict";
import test from "node:test";
import { Children, createElement, isValidElement } from "react";
import { renderToStaticMarkup as renderMarkup } from "react-dom/server";
import { AuthProvider } from "@/features/auth/auth-context";

import { copyProjectCode } from "./project-code-copy";
import { ProjectCodeRow, ProjectCodeRowView } from "./components/project-code-row";
import { ProjectContextStep } from "./components/project-context-step";
import { ProjectWorkspaceHeader } from "./components/project-workspace-header";
import { ProjectsTable } from "./components/projects-table";
import { DashboardRecentProjects } from "../dashboard/components/dashboard-recent-projects";
import type { ProjectWorkspace } from "./project-workspace-types";

const renderToStaticMarkup = (element: React.ReactNode) => renderMarkup(createElement(AuthProvider, null, element));

function workspace(): ProjectWorkspace {
  return {
    project: { id: "project-id", clientId: "client-id", code: "WEB-FULL-ORIGINAL-CODE", name: "Nombre del proyecto",
      location: "Bogotá", isActive: true, createdAtUtc: "2026-10-23T12:00:00Z", updatedAtUtc: "2026-10-23T12:00:00Z" },
    client: { id: "client-id", clientType: "Company", legalName: "Cliente", tradeName: null, email: null, phone: null, city: null },
    workflow: { resolutionState: "RESOLVED", preQuoteId: "prequote-id", requirementId: "requirement-id", requirementStatus: "PROCESSED",
      technicalProposalId: "proposal-id", hasTechnicalProposal: true },
    publicContext: null,
  };
}

test("copy preserves the complete original code for manual and public projects", async () => {
  for (const code of ["  MANUAL-001  ", "WEB-" + "long-code-".repeat(50)]) {
    const writes: string[] = [];
    assert.equal(await copyProjectCode(code, async (value) => { writes.push(value); }), "copied");
    assert.deepEqual(writes, [code]);
  }
});

test("copy success is only returned after the clipboard operation resolves", async () => {
  let complete!: () => void;
  let finished = false;
  const pending = copyProjectCode("CODE", () => new Promise<void>((resolve) => { complete = resolve; }));
  void pending.then(() => { finished = true; });
  await Promise.resolve();
  assert.equal(finished, false);
  complete();
  assert.equal(await pending, "copied");
});

test("clipboard rejection or an unavailable API produces a safe failure result", async () => {
  assert.equal(await copyProjectCode("CODE", async () => { throw new Error("internal detail"); }), "error");
  assert.equal(await copyProjectCode("CODE", () => { throw new TypeError("clipboard unavailable"); }), "error");
});

test("missing codes never reach the clipboard and offer no active copy action", async () => {
  for (const code of [null, undefined, "", "   "]) {
    let called = false;
    assert.equal(await copyProjectCode(code, async () => { called = true; }), "unavailable");
    assert.equal(called, false);
    const html = renderToStaticMarkup(createElement(ProjectCodeRow, { code }));
    assert.ok(!html.includes("<button"));
    assert.ok(!html.includes("Código copiado"));
  }
});

test("Context preserves the five static categories without fabricated answers or reserved answer rows", () => {
  const data = workspace();
  const html = renderToStaticMarkup(createElement(ProjectContextStep, {
    workspace: data, proposal: null, isProposalLoading: false, hasProposalError: false, onRetryProposal() {},
  }));
  const priorities = html.slice(html.indexOf('<section aria-labelledby="project-context-priorities-title"'));
  const labels = ["Confort térmico", "Control acústico", "Seguridad", "Protección UV", "Estética"];
  let previous = -1;
  for (const label of labels) {
    const position = priorities.indexOf(label);
    assert.ok(position > previous, label);
    previous = position;
  }
  assert.ok(!priorities.includes("Por definir"));
  assert.ok(!priorities.includes("min-h-24"));
  assert.ok(!priorities.includes("mt-0.5"));
  assert.ok(!html.includes(data.project.code));
  assert.ok(!html.includes("Copiar código"));
  assert.ok(html.includes("Ver código del proyecto"));
  assert.ok(html.indexOf("Ver código del proyecto") > html.indexOf("Estética"));
});

test("code disclosure starts closed without tabbable copy content, and open/closed states keep an accessible target", () => {
  const code = "  WEB-" + "code-".repeat(50);
  const initial = renderToStaticMarkup(createElement(ProjectCodeRow, { code }));
  assert.match(initial, /aria-expanded="false"/);
  assert.ok(!initial.includes(code));
  assert.ok(!initial.includes("Copiar código"));
  assert.equal(initial.match(/<button/g)?.length, 1);
  for (const open of [true, false]) {
    const html = renderToStaticMarkup(createElement(ProjectCodeRowView, { code, open, status: null, onToggle() {}, onCopy() {} }));
    assert.ok(html.includes(`aria-expanded="${open}"`));
    const target = html.match(/aria-controls="([^"]+)"/)?.[1];
    assert.ok(target);
    assert.ok(html.includes(`id="${target}"`));
    assert.equal(html.includes(code), open);
    assert.equal(html.includes("Copiar código"), open);
    assert.ok(html.includes(open ? "Ocultar código del proyecto" : "Ver código del proyecto"));
  }
});

test("copy feedback distinguishes success, pending copy and safe failure without copying on expansion", () => {
  for (const status of [null, "copying", "copied", "error"] as const) {
    let copies = 0;
    const html = renderToStaticMarkup(createElement(ProjectCodeRowView, {
      code: "ORIGINAL", open: true, status, onToggle() {}, onCopy() { copies++; },
    }));
    assert.equal(copies, 0);
    assert.equal(html.includes(">Copiado<"), status === "copied");
    assert.equal(html.includes("No se pudo copiar"), status === "error");
    if (status === "copying") assert.match(html, /disabled=""/);
  }
});

test("Context keys the disclosure by project identity, remounting closed with fresh feedback even for equal codes", () => {
  const props = { workspace: workspace(), proposal: null, isProposalLoading: false, hasProposalError: false, onRetryProposal() {} };
  const first = Children.toArray(ProjectContextStep(props).props.children).at(-1);
  const second = Children.toArray(ProjectContextStep({ ...props, workspace: {
    ...props.workspace, project: { ...props.workspace.project, id: "different-project" },
  } }).props.children).at(-1);
  assert.ok(isValidElement(first) && first.type === ProjectCodeRow);
  assert.ok(isValidElement(second) && second.type === ProjectCodeRow);
  assert.notEqual(first.key, second.key);
});

test("Context loading and error remain different from missing priority answers", () => {
  const render = (isProposalLoading: boolean, hasProposalError: boolean) => renderToStaticMarkup(createElement(ProjectContextStep, {
    workspace: workspace(), proposal: null, isProposalLoading, hasProposalError, onRetryProposal() {},
  }));
  const loading = render(true, false);
  const error = render(false, true);
  assert.ok(loading.includes("Cargando metricas del proyecto"));
  assert.ok(error.includes("No fue posible cargar las metricas"));
  assert.ok(error.includes("Reintentar"));
  assert.ok(!loading.includes("No fue posible cargar las metricas"));
});

test("workspace header keeps name, status, metadata and destination without the internal code", () => {
  const data = workspace();
  const html = renderToStaticMarkup(createElement(ProjectWorkspaceHeader, {
    workspace: data, readOnly: true, userInitials: "AB", isEditDisabled: false, isActivationDisabled: false,
    onRequestEdit() {}, onRequestActivation() {},
  }));
  assert.ok(!html.includes(data.project.code));
  for (const value of [data.project.name, "Activo", "Bogotá", "Cliente", 'href="/projects"']) assert.ok(html.includes(value));
});

test("project list and recent projects preserve duplicate names and distinct destinations without codes or orphan separators", () => {
  const data = workspace();
  const projects = ["manual-id", "public-id"].map((id, index) => ({
    ...data.project, id, code: index === 0 ? "MANUAL-FULL-CODE" : "WEB-FULL-CODE", description: "Descripción existente",
    client: { id: "client-id", clientType: "Company", legalName: "Cliente", tradeName: null, documentType: null, documentNumber: null },
  }));
  const list = renderToStaticMarkup(createElement(ProjectsTable, { items: projects, hasFilters: true, onClearFilters() {} }));
  const dashboard = renderToStaticMarkup(createElement(DashboardRecentProjects, { isLoading: false,
    projects: projects.map((project) => ({ ...project, projectId: project.id, clientName: "Cliente" })),
  }));
  for (const html of [list, dashboard]) {
    for (const project of projects) {
      assert.ok(html.includes(`href="/projects/${project.id}"`));
      assert.ok(!html.includes(project.code));
    }
    assert.ok(html.includes(data.project.name));
  }
  assert.ok(list.includes("Descripción existente"));
  assert.ok(list.includes("Bogotá"));
  assert.ok(!dashboard.includes(" · "));
});
