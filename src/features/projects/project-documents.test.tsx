import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { RequirementDetails } from "@/features/prequotes/requirement-types";
import { getRequirementById } from "@/features/prequotes/requirement-api";
import type { ProjectWorkspace } from "./project-workspace-types";
import { ApiError } from "@/lib/http/api-error";
import { createProjectDocumentsQuery, resolveProjectDocumentsContext, type ProjectDocumentsContext, type ProjectDocumentsState } from "./project-documents-query";
import { ProjectDocumentsView } from "./components/project-documents-step";

// All responses below are isolated test fixtures, not application/demo data.
function workspace(projectId = "project-a", requirementId = "requirement-a"): ProjectWorkspace {
  return {
    project: { id: projectId, clientId: "client", code: "WEB-COMMERCIAL-CODE", name: "Proyecto", location: null,
      isActive: true, createdAtUtc: "2026-10-23T12:00:00Z", updatedAtUtc: "2026-10-23T12:00:00Z" },
    client: { id: "client", clientType: "Company", legalName: "Cliente", tradeName: null, email: null, phone: null, city: null },
    workflow: { resolutionState: "RESOLVED", preQuoteId: "prequote", requirementId, requirementStatus: "PENDING",
      technicalProposalId: null, hasTechnicalProposal: false }, publicContext: null,
  };
}
function resolved(projectId = "project-a", requirementId = "requirement-a"): Extract<ProjectDocumentsContext, { status: "resolved" }> {
  const context = resolveProjectDocumentsContext(workspace(projectId, requirementId));
  assert.equal(context.status, "resolved");
  if (context.status !== "resolved") throw new Error("Expected resolved context");
  return context;
}
function details(requirementId = "requirement-a"): RequirementDetails {
  return {
    requirementId, preQuoteId: "prequote", status: "PENDING", commercialLine: null, isCurrent: true,
    canEditDocuments: true, canCancel: true, canReplace: false, supersedesRequirementId: null, supersededByRequirementId: null,
    createdAtUtc: "2026-10-23T12:00:00Z", updatedAtUtc: "2026-10-23T12:00:00Z",
    documents: [{ requirementFileId: "file-id", fileName: "Archivo original.pdf", contentType: "application/pdf", sizeBytes: 1024,
      createdAtUtc: "2026-10-23T11:00:00Z" }],
  };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const render = (state: ProjectDocumentsState, readOnly = false) => renderToStaticMarkup(createElement(ProjectDocumentsView, {
  state, readOnly, onRetry() {},
}));

test("resolution uses workspace identities for both manual and public projects, never codes or timestamps", () => {
  for (const code of ["MANUAL-1", "WEB-1"]) {
    const data = workspace();
    data.project.code = code;
    assert.deepEqual(resolveProjectDocumentsContext(data), resolved());
  }
});

test("EMPTY, AMBIGUOUS and incomplete identities cannot produce a resolved documents query", () => {
  for (const resolutionState of ["EMPTY", "AMBIGUOUS"] as const) {
    const data = workspace();
    data.workflow.resolutionState = resolutionState;
    assert.equal(resolveProjectDocumentsContext(data).status, resolutionState.toLowerCase());
  }
  for (const key of ["requirementId", "preQuoteId"] as const) {
    const data = workspace();
    data.workflow[key] = null;
    assert.equal(resolveProjectDocumentsContext(data).status, "unavailable");
  }
});

test("query only invokes the injected reader with the resolved id and preserves document order", async () => {
  const states: ProjectDocumentsState[] = [];
  const calls: string[] = [];
  const response = details();
  response.documents.push({ ...response.documents[0], requirementFileId: "file-2", fileName: "A.pdf" });
  const query = createProjectDocumentsQuery(resolved(), async (id) => { calls.push(id); return response; }, (state) => states.push(state));
  await query.load();
  assert.deepEqual(calls, ["requirement-a"]);
  assert.equal(states[0].status, "loading");
  assert.deepEqual(states.at(-1), { status: "success", details: response });
  const html = render(states.at(-1)!);
  assert.ok(html.indexOf("Archivo original.pdf") < html.indexOf("A.pdf"));
});

test("responses for a different document set or prequote become errors without exposing their files", async () => {
  for (const response of [{ ...details(), requirementId: "wrong" }, { ...details(), preQuoteId: "wrong" }]) {
    const states: ProjectDocumentsState[] = [];
    await createProjectDocumentsQuery(resolved(), async () => response, (state) => states.push(state)).load();
    assert.equal(states.at(-1)?.status, "error");
    assert.ok(!render(states.at(-1)!).includes("Archivo original.pdf"));
  }
});

test("disposed project or document-set sessions cannot publish late success or failure", async () => {
  for (const failure of [false, true]) {
    const oldResponse = deferred<RequirementDetails>();
    const states: ProjectDocumentsState[] = [];
    const old = createProjectDocumentsQuery(resolved(), () => oldResponse.promise, (state) => states.push(state));
    const pending = old.load();
    old.dispose();
    const next = createProjectDocumentsQuery(resolved("project-b", "requirement-b"), async () => details("requirement-b"), (state) => states.push(state));
    await next.load();
    const beforeLate = [...states];
    if (failure) oldResponse.reject(new Error("old failure")); else oldResponse.resolve(details());
    await pending;
    assert.deepEqual(states, beforeLate);
    assert.deepEqual(states.at(-1), { status: "success", details: details("requirement-b") });
  }
});

test("a newer reload wins over an earlier response in the same session", async () => {
  const first = deferred<RequirementDetails>();
  const states: ProjectDocumentsState[] = [];
  let calls = 0;
  const latest = details();
  latest.documents = [];
  const query = createProjectDocumentsQuery(resolved(), () => ++calls === 1 ? first.promise : Promise.resolve(latest), (state) => states.push(state));
  const old = query.load();
  await query.load();
  first.resolve(details());
  await old;
  assert.deepEqual(states.at(-1), { status: "success", details: latest });
});

test("failed reload removes old data; retry remains a query and unmounted queries cannot start", async () => {
  const states: ProjectDocumentsState[] = [];
  let calls = 0;
  const query = createProjectDocumentsQuery(resolved(), async () => {
    calls++;
    if (calls === 2) throw new Error("internal path");
    return details();
  }, (state) => states.push(state));
  await query.load();
  await query.load();
  assert.equal(states.at(-1)?.status, "error");
  assert.ok(!render(states.at(-1)!).includes("Archivo original.pdf"));
  await query.load();
  assert.equal(states.at(-1)?.status, "success");
  query.dispose();
  await query.load();
  assert.equal(calls, 3);
});

test("loading, workspace absence, ambiguity, empty set and error are distinct presentations", () => {
  const loading = render({ status: "loading" });
  assert.ok(loading.includes('aria-busy="true"'));
  assert.ok(!loading.includes("No hay archivos"));
  assert.ok(render({ status: "empty" }).includes("Este proyecto aún no tiene documentos disponibles."));
  assert.ok(render({ status: "ambiguous" }).includes("qué conjunto documental mostrar"));
  const response = details();
  response.documents = [];
  assert.ok(render({ status: "success", details: response }).includes("No hay archivos disponibles"));
  const error = render({ status: "error", cause: new Error("stack SECRET") });
  assert.ok(error.includes("Volver a cargar"));
  assert.ok(!error.includes("No hay archivos"));
  assert.ok(!error.includes("SECRET"));
});

test("authentication, authorization and missing-resource failures have safe operation-specific copy", () => {
  for (const status of [401, 403, 404]) {
    const html = render({ status: "error", cause: new ApiError({ status, title: "TECHNICAL", detail: "SECRET_ID" }) });
    assert.ok(html.includes("Volver a cargar"));
    assert.ok(!html.includes("TECHNICAL"));
    assert.ok(!html.includes("SECRET_ID"));
  }
});

test("readOnly and editable users both get consultation only, including when server mutation capabilities are true", () => {
  for (const readOnly of [false, true]) {
    const html = render({ status: "success", details: details() }, readOnly);
    assert.ok(html.includes("Archivo original.pdf"));
    assert.ok(html.includes(readOnly ? "Solo lectura" : "Solo consulta"));
    assert.ok(!html.includes("<button"));
    assert.ok(!html.includes("<input"));
    assert.ok(!html.includes("href="));
    assert.ok(!html.includes("requirement-a"));
    assert.ok(!html.includes("file-id"));
    assert.ok(!html.includes("Descargar"));
  }
});

test("version context comes from current/successor fields without numbering, history links or job status", () => {
  const response = details();
  assert.ok(render({ status: "success", details: response }).includes("Documentos actuales"));
  response.isCurrent = false;
  response.supersededByRequirementId = "successor";
  const html = render({ status: "success", details: response });
  assert.ok(html.includes("Versión anterior · Solo consulta"));
  assert.ok(!html.includes("successor"));
  assert.ok(!html.includes("En cola"));
  assert.ok(!html.includes("Versión 1"));
});

test("long names and available metadata are retained; missing metadata is never rendered as zero or a fabricated date", () => {
  const response = details();
  response.documents[0].fileName = "Nombre-muy-largo-".repeat(40) + ".pdf";
  const html = render({ status: "success", details: response });
  assert.ok(html.includes(response.documents[0].fileName));
  assert.ok(html.includes("PDF"));
  assert.ok(html.includes("1.00 KB"));
  assert.match(html, /<time[^>]*datetime="2026-10-23T11:00:00Z"/i);
  // Defensive view test only: the real client rejects incomplete document records.
  response.documents[0].sizeBytes = Number.NaN;
  response.documents[0].createdAtUtc = "";
  response.documents[0].contentType = "unknown";
  const absent = render({ status: "success", details: response });
  assert.ok(!absent.includes("0 B"));
  assert.ok(!absent.includes("<time"));
  assert.ok(!absent.includes("unknown"));
});

test("the existing API reader uses only GET without a body on initial load and manual reload (mock fetch)", async () => {
  const oldFetch = globalThis.fetch;
  const oldUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://documents.test";
  const states: ProjectDocumentsState[] = [];
  let calls = 0;
  try {
    globalThis.fetch = async (url, options) => {
      calls++;
      assert.equal(String(url), "http://documents.test/api/v2/requirements/requirement%20a");
      assert.equal(options?.method, "GET");
      assert.equal(options?.body, undefined);
      return Response.json(details("requirement a"));
    };
    const query = createProjectDocumentsQuery({ ...resolved(), requirementId: "requirement a" }, getRequirementById, (state) => states.push(state));
    await query.load();
    await query.load();
    assert.equal(calls, 2);
    assert.equal(states.at(-1)?.status, "success");
    globalThis.fetch = async () => Response.json({ detail: "SECRET" }, { status: 503 });
    await query.load();
    assert.equal(states.at(-1)?.status, "error");
    assert.ok(!render(states.at(-1)!).includes("SECRET"));
    query.dispose();
  } finally {
    globalThis.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = oldUrl;
  }
});
