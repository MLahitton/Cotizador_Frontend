import assert from "node:assert/strict";
import test from "node:test";
import { Children, createElement, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ApiError } from "@/lib/http/api-error";
import type { RequirementDetails, RequirementLifecycleResponse } from "@/features/prequotes/requirement-types";
import { addRequirementDocument, replaceRequirementDocument, removeRequirementDocument, replaceRequirement } from "@/features/prequotes/requirement-api";
import { canMutateDocuments, createDocumentMutationSession, documentMutationFailure, type DocumentMutationApi, type DocumentMutationState, type DocumentOperation } from "./project-document-mutations";
import { ProjectDocumentActionForm, ProjectDocumentActions } from "./components/project-document-actions";
import { ProjectDocumentsView } from "./components/project-documents-step";

// Isolated fixtures and mock transport only; no real project is mutated.
const context = { status: "resolved" as const, projectId: "project-a", requirementId: "old", preQuoteId: "quote" };
function details(): RequirementDetails {
  return { requirementId: "old", preQuoteId: "quote", status: "PENDING", commercialLine: "ESSENTIAL", isCurrent: true,
    canEditDocuments: true, canCancel: true, canReplace: true, supersedesRequirementId: null, supersededByRequirementId: null,
    createdAtUtc: "2026-10-23T12:00:00Z", updatedAtUtc: "2026-10-23T12:00:00Z", documents: ["first", "second"].map((id) => ({
      requirementFileId: id, fileName: `${id}.pdf`, contentType: "application/pdf", sizeBytes: 10, createdAtUtc: "2026-10-23T12:00:00Z",
    })) };
}
function response(replacement = false): RequirementLifecycleResponse {
  return { ...details(), fileCount: 2, requirementId: replacement ? "new" : "old", supersedesRequirementId: replacement ? "old" : null };
}
const file = () => new File(["fixture"], "fixture.pdf", { type: "application/pdf" });
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (cause: unknown) => void; const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; }
function setup(api: Partial<DocumentMutationApi> = {}) {
  const calls: string[] = [];
  const states: DocumentMutationState[] = [];
  const successes: RequirementLifecycleResponse[] = [];
  const replacements: RequirementLifecycleResponse[] = [];
  let refreshes = 0;
  const session = createDocumentMutationSession(context, {
    add: async () => { calls.push("add"); return response(); },
    substitute: async () => { calls.push("substitute"); return response(); },
    remove: async () => { calls.push("remove"); return response(); },
    replacement: async () => { calls.push("replacement"); return response(true); }, ...api,
  }, (state) => states.push(state));
  const submit = (overrides: Partial<Parameters<typeof session.submit>[0]> = {}) => session.submit({
    operation: "add", details: details(), readOnly: false, files: [file()], documentId: "first",
    onSuccess: (result) => successes.push(result), onReplacement: (result) => replacements.push(result),
    onRefresh: () => { refreshes++; }, ...overrides,
  });
  return { session, submit, calls, states, successes, replacements, get refreshes() { return refreshes; } };
}
const apiError = (status: number, errorCode?: string) => new ApiError({ status, title: "TECHNICAL", detail: "SECRET_PATH", problemDetails: { errorCode } });

test("capabilities and readOnly govern actions independently of status, and removal preserves the last document", async () => {
  const current = details();
  for (const operation of ["add", "substitute", "remove", "replacement"] as const) {
    assert.equal(canMutateDocuments(current, true, operation), false);
    assert.equal(await setup().submit({ operation, readOnly: true }), false);
  }
  current.canEditDocuments = false;
  assert.equal(await setup().submit({ details: current }), false);
  current.canReplace = false;
  assert.equal(await setup().submit({ operation: "replacement", details: current }), false);
  current.canEditDocuments = true;
  current.status = "FAILED"; // Deliberately inconsistent fixture: frontend must not reconstruct backend policy.
  assert.equal(canMutateDocuments(current, false, "add"), true);
  current.documents = current.documents.slice(0, 1);
  assert.equal(await setup().submit({ operation: "remove", details: current }), false);
  current.isCurrent = false;
  assert.equal(await setup().submit({ details: current }), false);
});

test("missing targets and invalid file selection reject locally without changing the submitted values", async () => {
  const run = setup();
  const files: File[] = [];
  assert.equal(await run.submit({ files }), false);
  assert.deepEqual(files, []);
  assert.equal(await run.submit({ operation: "substitute", documentId: "another-version" }), false);
  assert.equal(await run.submit({ files: [file(), file()] }), false);
  assert.deepEqual(run.calls, []);
});

test("double clicks and other concurrent operations produce one request for the version", async () => {
  const pending = deferred<RequirementLifecycleResponse>();
  let count = 0;
  const run = setup({ add: () => { count++; return pending.promise; } });
  const first = run.submit();
  assert.equal(await run.submit(), false);
  assert.equal(await run.submit({ operation: "remove" }), false);
  assert.equal(count, 1);
  assert.equal(run.states.at(-1)?.kind, "busy");
  pending.resolve(response());
  assert.equal(await first, true);
  assert.equal(run.successes.length, 1);
});

test("validation failures preserve selection and permit only a new explicit submission", async () => {
  let calls = 0;
  const run = setup({ add: async () => { calls++; throw apiError(415, "REQUIREMENT_UNSUPPORTED_FILE_TYPE"); } });
  const files = [file()];
  assert.equal(await run.submit({ files }), false);
  assert.equal(run.states.at(-1)?.kind, "validation");
  assert.equal(run.states.at(-1)?.needsRead, false);
  assert.equal(calls, 1);
  assert.equal(files[0].name, "fixture.pdf");
  assert.equal(run.refreshes, 0);
  assert.equal(run.successes.length, 0);
});

test("structured lifecycle conflict refreshes once and only a fresh matching read can unblock actions", async () => {
  const run = setup({ add: async () => { throw apiError(409, "REQUIREMENT_NOT_MUTABLE"); } });
  const snapshot = details();
  await run.submit({ details: snapshot });
  assert.equal(run.states.at(-1)?.kind, "conflict");
  assert.equal(run.refreshes, 1);
  run.session.acknowledgeRead(snapshot);
  assert.equal(run.states.at(-1)?.needsRead, true);
  run.session.acknowledgeRead({ ...snapshot, requirementId: "other" });
  assert.equal(run.states.at(-1)?.needsRead, true);
  const fresh = { ...details(), canEditDocuments: false };
  run.session.acknowledgeRead(fresh);
  assert.equal(run.states.at(-1)?.needsRead, false);
  assert.equal(await run.submit({ details: fresh }), false);
});

test("generic 409 is not a specific lifecycle conflict; server detail never becomes commercial copy", async () => {
  const generic = documentMutationFailure(apiError(409, "ANOTHER_CONFLICT"));
  assert.equal(generic.kind, "rejected");
  assert.equal(generic.needsRead, true);
  assert.ok(!generic.message.includes("SECRET_PATH"));
  assert.equal(documentMutationFailure(apiError(409, "REQUIREMENT_NOT_REPLACEABLE")).kind, "conflict");
  const run = setup({ add: async () => { throw apiError(409, "ANOTHER_CONFLICT"); } });
  await run.submit();
  assert.equal(run.refreshes, 0);
  assert.equal(await run.submit(), false);
});

test("uncertain network or persistence outcomes block resending without an automatic mutation or success claim", async () => {
  for (const error of [apiError(0), apiError(500, "REQUIREMENT_PERSISTENCE_ERROR"), new Error("SECRET")]) {
    let calls = 0;
    const run = setup({ add: async () => { calls++; throw error; } });
    await run.submit();
    assert.equal(await run.submit(), false);
    assert.equal(calls, 1);
    assert.equal(run.states.at(-1)?.kind, "uncertain");
    assert.equal(run.refreshes, 0);
    assert.equal(run.successes.length, 0);
    assert.ok(!run.states.at(-1)?.message.includes("SECRET"));
  }
});

test("late mutation replies cannot publish or refresh after a project change/unmount", async () => {
  for (const operation of ["add", "substitute", "remove", "replacement"] as const) {
  for (const failed of [false, true]) {
  const pending = deferred<RequirementLifecycleResponse>();
  const run = setup({ [operation]: () => pending.promise });
  const request = run.submit({ operation });
  run.session.dispose();
  const count = run.states.length;
  if (failed) pending.reject(apiError(500)); else pending.resolve(response(operation === "replacement"));
  await request;
  assert.equal(run.states.length, count);
  assert.equal(run.replacements.length, 0);
  assert.equal(run.successes.length, 0);
  assert.equal(run.refreshes, 0);
  }
  }
});

test("replacement returns the new backend identity and permanently freezes the old session", async () => {
  const run = setup();
  assert.equal(await run.submit({ operation: "replacement" }), true);
  assert.equal(run.replacements[0].requirementId, "new");
  assert.equal(run.replacements[0].supersedesRequirementId, "old");
  assert.equal(run.states.at(-1)?.kind, "replaced");
  assert.equal(await run.submit(), false);
  assert.equal(await run.submit({ operation: "replacement" }), false);
  assert.deepEqual(run.calls, ["replacement"]);
});

test("consultation after uncertain replacement preserves the same context or refreshes workspace when identity changed", async () => {
  for (const changed of [false, true]) {
    const run = setup({ replacement: async () => { throw apiError(0); } });
    await run.submit({ operation: "replacement" });
    let same = 0;
    let different = 0;
    await run.session.consultIdentity(async (id) => {
      assert.equal(id, "quote");
      return { ...details(), requirementId: changed ? "new" : "old", hasTechnicalProposal: false, technicalProposalId: null,
        latestAttemptState: null, latestAttemptOutcome: null, latestAttemptErrorCode: null };
    }, () => { same++; }, () => { different++; });
    assert.equal(same, changed ? 0 : 1);
    assert.equal(different, changed ? 1 : 0);
    assert.equal(run.successes.length, 0);
    assert.equal(run.replacements.length, 0);
    assert.equal(run.states.at(-1)?.needsRead, true);
  }
});

test("unexpected response identity is uncertain and never updates a different version or project", async () => {
  const run = setup({ add: async () => ({ ...response(), preQuoteId: "foreign" }) });
  assert.equal(await run.submit(), false);
  assert.equal(run.states.at(-1)?.kind, "uncertain");
  assert.equal(run.successes.length, 0);
  const replacement = setup({ replacement: async () => response(false) });
  assert.equal(await replacement.submit({ operation: "replacement" }), false);
  assert.equal(replacement.replacements.length, 0);
});

test("successful actions forward server documents and capabilities without optimistic deletions", async () => {
  const pending = deferred<RequirementLifecycleResponse>();
  const run = setup({ remove: () => pending.promise });
  const current = details();
  const operation = run.submit({ operation: "remove", details: current });
  assert.equal(current.documents.length, 2);
  assert.equal(run.successes.length, 0);
  const result = { ...response(), documents: current.documents.slice(1), fileCount: 1, canEditDocuments: false };
  pending.resolve(result);
  await operation;
  assert.equal(run.successes[0], result);
  assert.equal(current.documents.length, 2);
});

test("readOnly never renders mutations; available actions use capabilities without processing or download controls", () => {
  const props = { context, details: details(), readOnly: true, onSuccess() {}, onReplacement() {}, onRefresh() {}, onRefreshWorkspace() {} };
  assert.equal(renderToStaticMarkup(createElement(ProjectDocumentActions, props)), "");
  const html = renderToStaticMarkup(createElement(ProjectDocumentActions, { ...props, readOnly: false }));
  for (const label of ["Agregar documentos", "Sustituir archivo", "Quitar documento", "Crear nueva versión"]) assert.ok(html.includes(label));
  for (const label of ["Descargar", "Detener", "Reintentar", "Analizar", "Descartar"]) assert.ok(!html.includes(label));
  const unavailable = renderToStaticMarkup(createElement(ProjectDocumentActions, { ...props, readOnly: false, details: { ...details(), canEditDocuments: false, canReplace: false } }));
  assert.ok(!unavailable.includes("<button"));
});

test("existing multipart clients use exact endpoints, payload and methods for all four actions (mock transport)", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://documents.test";
  const api: DocumentMutationApi = { add: addRequirementDocument, substitute: replaceRequirementDocument, remove: removeRequirementDocument, replacement: replaceRequirement };
  const expected: Record<DocumentOperation, [string, string]> = {
    add: ["POST", "/api/v2/requirements/old/documents"], substitute: ["PUT", "/api/v2/requirements/old/documents/first"],
    remove: ["DELETE", "/api/v2/requirements/old/documents/first"], replacement: ["POST", "/api/v2/requirements/old/replacement"],
  };
  try {
    for (const operation of ["add", "substitute", "remove", "replacement"] as const) {
      let requests = 0;
      const files = operation === "replacement" ? [file(), new File(["second fixture"], "complete-set.png", { type: "image/png" })] : [file()];
      globalThis.fetch = async (url, options) => {
        requests++;
        assert.equal(String(url), "http://documents.test" + expected[operation][1]);
        assert.equal(options?.method, expected[operation][0]);
        if (operation === "remove") assert.equal(options?.body, undefined);
        else {
          assert.ok(options?.body instanceof FormData);
          assert.deepEqual(Array.from(options.body.keys()), files.map(() => "files"));
          assert.deepEqual(options.body.getAll("files").map((entry) => (entry as File).name), files.map((entry) => entry.name));
          assert.equal(new Headers(options.headers).has("Content-Type"), false);
        }
        return Response.json(response(operation === "replacement"));
      };
      const states: DocumentMutationState[] = [];
      let received: RequirementLifecycleResponse | null = null;
      const session = createDocumentMutationSession(context, api, (state) => states.push(state));
      assert.equal(await session.submit({ operation, details: details(), readOnly: false, files, documentId: "first",
        onSuccess: (result) => { received = result; }, onReplacement: (result) => { received = result; }, onRefresh() {},
      }), true);
      assert.ok(received);
      assert.equal(requests, 1);
      assert.ok(states.at(-1)?.kind === "success" || states.at(-1)?.kind === "replaced");
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL; else process.env.NEXT_PUBLIC_API_BASE_URL = originalUrl;
  }
});

function visit(node: ReactNode, callback: (element: ReactElement<Record<string, unknown>>) => void) {
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown> & { children?: ReactNode }>(child)) return;
    callback(child);
    visit(child.props.children, callback);
  });
}
function formProps(overrides: Partial<ComponentProps<typeof ProjectDocumentActionForm>> = {}): ComponentProps<typeof ProjectDocumentActionForm> {
  return { operation: "remove", details: details(), files: [], documentId: "first", busy: false, locked: false,
    permitted: true, closeDisabled: false, onSubmit() {}, onDocumentChange() {}, onFilesChange() {}, onClose() {}, ...overrides };
}

test("closing the named removal confirmation sends no DELETE; only explicit confirmation submits it", async () => {
  const run = setup();
  const requests: Promise<boolean>[] = [];
  let closed = 0;
  const props = formProps({ onSubmit: () => { requests.push(run.submit({ operation: "remove", files: [] })); }, onClose: () => { closed++; } });
  const form = ProjectDocumentActionForm(props);
  const html = renderToStaticMarkup(form);
  assert.ok(html.includes("Archivo: first.pdf"));
  assert.ok(html.includes("Confirmar: quitar documento"));
  visit(form, (element) => {
    if (element.props.children !== "Cerrar") return;
    assert.equal(element.props.type, "button");
    (element.props.onClick as () => void)();
  });
  assert.equal(closed, 1);
  assert.equal(requests.length, 0);
  assert.deepEqual(run.calls, []);
  let prevented = false;
  form.props.onSubmit({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(await requests[0], true);
  assert.deepEqual(run.calls, ["remove"]);
});

test("the form blocks submission while busy, awaiting a read, denied, or targeting a vanished file", () => {
  let submissions = 0;
  let closed = 0;
  for (const overrides of [{ busy: true, locked: true, closeDisabled: true }, { locked: true, closeDisabled: true },
    { permitted: false }, { documentId: "previous-version-file" }]) {
    const form = ProjectDocumentActionForm(formProps({ ...overrides, onSubmit: () => { submissions++; }, onClose: () => { closed++; } }));
    form.props.onSubmit({ preventDefault() {} });
    if (overrides.closeDisabled) visit(form, (element) => {
      if (element.props.children === "Cerrar") (element.props.onClick as () => void)();
    });
  }
  assert.equal(submissions, 0);
  assert.equal(closed, 0);
});

test("file inputs remount between operations, allow one file except replacement, and retain full names", () => {
  const keys: Array<string | null> = [];
  const longFile = new File(["fixture"], "synthetic-".repeat(35) + ".pdf", { type: "application/pdf" });
  for (const operation of ["add", "substitute", "replacement"] as const) {
    const selected: File[][] = [];
    const form = ProjectDocumentActionForm(formProps({ operation, files: [longFile], onFilesChange: (files) => selected.push(files) }));
    assert.ok(renderToStaticMarkup(form).includes(longFile.name));
    visit(form, (element) => {
      if (element.type !== "input" || element.props.type !== "file") return;
      keys.push(element.key);
      assert.equal(element.props.multiple, operation === "replacement");
      (element.props.onChange as (event: { target: { files: File[] } }) => void)({ target: { files: [longFile] } });
    });
    assert.deepEqual(selected, [[longFile]]);
  }
  assert.equal(new Set(keys).size, 3);
});

test("document actions and their restriction stay inside the main document section after its list", () => {
  const current = { ...details(), canEditDocuments: false, canReplace: true };
  const html = renderToStaticMarkup(createElement(ProjectDocumentsView,
    { state: { status: "success", details: current }, readOnly: false, hasActions: true, onRetry() {} },
    createElement(ProjectDocumentActions, { context, details: current, readOnly: false, onSuccess() {}, onReplacement() {}, onRefresh() {}, onRefreshWorkspace() {} }),
  ));
  assert.ok(html.indexOf("</ul>") < html.indexOf("Crear nueva versión"));
  assert.ok(html.indexOf("Los archivos de esta versión no admiten cambios.") < html.indexOf("</section>"));
  assert.ok(!html.includes("Acciones disponibles"));
});

test("a late identity consultation cannot refresh another project and consultation never repeats a mutation", async () => {
  let writes = 0;
  let reads = 0;
  const run = setup({ replacement: async () => { writes++; throw apiError(0); } });
  await run.submit({ operation: "replacement" });
  const pending = deferred<null>();
  let refreshes = 0;
  const load = () => { reads++; return pending.promise; };
  const consultation = run.session.consultIdentity(load, () => { refreshes++; }, () => { refreshes++; });
  await run.session.consultIdentity(load, () => { refreshes++; }, () => { refreshes++; });
  run.session.dispose();
  const published = run.states.length;
  pending.resolve(null);
  await consultation;
  assert.equal(run.states.length, published);
  assert.equal(refreshes, 0);
  assert.equal(writes, 1);
  assert.equal(reads, 1);
});
