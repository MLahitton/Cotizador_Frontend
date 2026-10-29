import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectExtractionStatus, extractionCopy } from "./components/project-extraction-status";
import { createExtractionRefresh, mergeWorkflowRefresh } from "./workspace-extraction-refresh";
import type { ProjectWorkspace, WorkspaceExtraction } from "./project-workspace-types";

function response(refresh = true): ProjectWorkspace {
  return { project: { id: "project" }, workflow: { requirementId: "version", extraction: { state: refresh ? "Running" : "Succeeded", refreshRecommended: refresh, canAnalyze: false } } } as ProjectWorkspace;
}
function harness(read: (signal: AbortSignal) => Promise<ProjectWorkspace>, limit = 20) {
  let callback: (() => void) | undefined;
  let current = true;
  const applied: ProjectWorkspace[] = []; const notices: string[] = [];
  const dispose = createExtractionRefresh({ read, limit, current: () => current,
    apply: (value) => applied.push(value), notice: (value) => { if (value) notices.push(value); },
    schedule: (run, delay) => { assert.equal(delay, 7000); callback = run; return () => { callback = undefined; }; },
  });
  return { applied, notices, dispose, consult: dispose.consult, changeSession: () => { current = false; },
    scheduled: () => Boolean(callback), tick: async () => { const run = callback; callback = undefined; run?.(); await new Promise((r) => setImmediate(r)); } };
}

for (const state of Object.keys(extractionCopy) as WorkspaceExtraction["state"][]) {
  test(`commercial status ${state}, no execution actions`, () => {
    const html = renderToStaticMarkup(createElement(ProjectExtractionStatus, {
      extraction: { state, refreshRecommended: false, canAnalyze: false }, projectId: "project", configuration: true,
    }));
    if (state === "Manual") assert.equal(html, ""); else assert.ok(html.includes(extractionCopy[state][0]));
    assert.ok(!html.includes("<button")); assert.ok(!html.includes("%"));
    assert.equal(html.includes("Ver documentos"), ["Failed", "Cancelled", "ContinuityUnknown", "Inconsistent"].includes(state));
  });
}
test("bounded reads stop without fabricating a terminal", async () => {
  const h = harness(async () => response(), 2); await h.tick(); assert.ok(h.scheduled()); await h.tick();
  assert.equal(h.applied.length, 2); assert.equal(h.applied[1].workflow.extraction?.state, "Running");
  assert.equal(h.notices.length, 1); assert.equal(h.scheduled(), false); h.dispose();
});
test("results stop polling and retain exact response", async () => {
  const value = response(false); const h = harness(async () => value); await h.tick();
  assert.equal(h.applied[0], value); assert.equal(h.scheduled(), false); assert.equal(h.notices.length, 0); h.dispose();
});
test("error preserves the previous result and stops reads", async () => {
  let count = 0; const h = harness(async () => { if (++count === 2) throw Error("network"); return response(); });
  await h.tick(); await h.tick(); assert.equal(h.applied.length, 1); assert.equal(h.notices.length, 1);
  assert.equal(h.scheduled(), false); h.dispose();
});
test("no overlapping reads, abort on unmount, discard late response", async () => {
  let resolve!: (value: ProjectWorkspace) => void; let signal!: AbortSignal; let reads = 0;
  const h = harness((ct) => { signal = ct; reads++; return new Promise((r) => { resolve = r; }); });
  await h.tick(); await h.tick(); assert.equal(reads, 1); assert.equal(h.scheduled(), false);
  h.dispose(); assert.equal(signal.aborted, true); resolve(response(false)); await new Promise((r) => setImmediate(r));
  assert.equal(h.applied.length, 0); assert.equal(h.notices.length, 0);
});
test("session/project invalidation discards a late result", async () => {
  let resolve!: (value: ProjectWorkspace) => void;
  const h = harness(() => new Promise((r) => { resolve = r; })); await h.tick(); h.changeSession(); resolve(response());
  await new Promise((r) => setImmediate(r)); assert.equal(h.applied.length, 0); assert.equal(h.scheduled(), false); h.dispose();
});
test("workflow refresh preserves project and public context references", () => {
  const current = response(); const next = response(false);
  current.project.name = "Edicion comercial local";
  const merged = mergeWorkflowRefresh(current, next);
  assert.equal(merged.project, current.project); assert.equal(merged.publicContext, current.publicContext);
  assert.equal(merged.workflow, next.workflow); assert.equal(merged.project.name, "Edicion comercial local");
  assert.equal(mergeWorkflowRefresh(current, structuredClone(current)), current);
});

test("explicit read after limit starts only on command and can reach results", async () => {
  let terminal = false;
  const h = harness(async () => response(!terminal), 2);
  await h.tick(); await h.tick(); assert.equal(h.scheduled(), false);
  terminal = true; await h.consult();
  assert.equal(h.applied.at(-1)?.workflow.extraction?.state, "Succeeded");
  assert.equal(h.scheduled(), false); h.dispose();
});

test("explicit reads share the polling gate and allow retry after error", async () => {
  let fail = true; let reads = 0;
  let resolve!: (value: ProjectWorkspace) => void;
  const h = harness(async () => { reads++; if (fail) throw Error("network"); return new Promise((r) => { resolve = r; }); });
  await h.tick(); assert.equal(h.applied.length, 0); assert.equal(h.scheduled(), false);
  fail = false; const first = h.consult(); await h.consult(); await h.tick();
  assert.equal(reads, 2); resolve(response(false)); await first;
  assert.equal(h.applied.length, 1); h.dispose();
});

test("explicit pending read is aborted and discarded on context cleanup", async () => {
  let resolve!: (value: ProjectWorkspace) => void; let signal!: AbortSignal;
  const h = harness((ct) => { signal = ct; return new Promise((r) => { resolve = r; }); });
  const pending = h.consult(); h.dispose(); assert.equal(signal.aborted, true);
  resolve(response()); await pending; assert.equal(h.applied.length, 0); assert.equal(h.scheduled(), false);
});

for (const outcome of ["resolve", "reject", "abort"] as const) {
  test(`disposed read releases its own loading, late ${outcome} cannot clear a newer read`, async () => {
    let finishOld!: (value: ProjectWorkspace) => void;
    let failOld!: (error: Error) => void;
    let finishNew!: (value: ProjectWorkspace) => void;
    let loading: symbol | null = null;
    const applied: ProjectWorkspace[] = [];
    const busy = (request: symbol, value: boolean) => {
      if (value) loading = request;
      else if (loading === request) loading = null;
    };
    const common = { current: () => true, apply: (value: ProjectWorkspace) => applied.push(value),
      busy, notice: () => {}, initialRefresh: false, schedule: () => () => {} };
    let oldSignal!: AbortSignal;
    const old = createExtractionRefresh({ ...common, read: (signal) => {
      oldSignal = signal;
      return new Promise((resolve, reject) => { finishOld = resolve; failOld = reject; });
    } });
    const oldPending = old.consult();
    const oldOwner = loading;
    assert.notEqual(oldOwner, null);
    old();
    assert.equal(oldSignal.aborted, true);
    assert.equal(loading, null);
    const next = createExtractionRefresh({ ...common, read: () => new Promise((resolve) => { finishNew = resolve; }) });
    const newPending = next.consult(); const newOwner = loading;
    assert.notEqual(newOwner, null); assert.notEqual(newOwner, oldOwner);
    if (outcome === "resolve") finishOld(response(false));
    else failOld(outcome === "abort" ? new DOMException("Aborted", "AbortError") : Error("late failure"));
    await oldPending;
    assert.equal(loading, newOwner); assert.equal(applied.length, 0);
    finishNew(response(false)); await newPending;
    assert.equal(loading, null); assert.equal(applied.length, 1); next();
  });
}

test("resolution before cleanup releases loading and later cleanup cannot clear another controller", async () => {
  let loading: symbol | null = null;
  const busy = (request: symbol, value: boolean) => {
    if (value) loading = request; else if (loading === request) loading = null;
  };
  const common = { current: () => true, busy, apply: () => {}, notice: () => {}, initialRefresh: false, schedule: () => () => {} };
  const old = createExtractionRefresh({ ...common, read: async () => response(false) });
  await old.consult(); assert.equal(loading, null);
  let finish!: (value: ProjectWorkspace) => void;
  const next = createExtractionRefresh({ ...common, read: () => new Promise((resolve) => { finish = resolve; }) });
  const pending = next.consult(); const owner = loading;
  old(); assert.equal(loading, owner); assert.notEqual(owner, null);
  finish(response(false)); await pending; assert.equal(loading, null); next();
});
