import assert from "node:assert/strict";
import test from "node:test";
import type { CurrentRequirement, ProcessedRequirement } from "../prequotes/requirement-types";
import { createProjectRequirementAnalysis, type ProjectAnalysisState } from "./project-requirement-analysis";

function setup(overrides: Partial<Parameters<typeof createProjectRequirementAnalysis>[0]> = {}) {
  const changes: ProjectAnalysisState[] = [];
  const calls: string[] = [];
  let refreshes = 0;
  let timer: (() => void) | null = null;
  const session = createProjectRequirementAnalysis({
    requirementId: "requirement-1", preQuoteId: "prequote-1", status: "PENDING", readOnly: false,
    processRequirement: async (id) => {
      calls.push(id);
      return { outcome: "Completed" } as ProcessedRequirement;
    },
    getCurrentRequirement: async () => ({ requirementId: "requirement-1", status: "PROCESSING" }) as CurrentRequirement,
    isAlreadyActive: (error) => error === "already-active",
    errorMessage: () => "Mensaje amigable",
    failureMessage: () => "No fue posible completar el análisis",
    onChange: (state) => changes.push(state),
    onRefresh: () => { refreshes++; },
    schedule: (callback, delay) => {
      assert.equal(delay, 7000);
      timer = callback;
      return () => { timer = null; };
    },
    ...overrides,
  });
  return {
    session, changes, calls,
    get refreshes() { return refreshes; },
    get hasTimer() { return timer !== null; },
    async tick() {
      const callback = timer;
      timer = null;
      callback?.();
      await new Promise<void>((resolve) => setImmediate(resolve));
    },
  };
}

test("PENDING never processes automatically; manual process uses the existing id and refreshes", async () => {
  const run = setup();
  run.session.startPolling();
  assert.equal(run.hasTimer, false);
  assert.deepEqual(run.calls, []);
  await run.session.process();
  assert.deepEqual(run.calls, ["requirement-1"]);
  assert.equal(run.changes[0].isSubmitting, true);
  assert.equal(run.changes.at(-1)?.status, "PROCESSED");
  assert.equal(run.refreshes, 1);
});

test("readOnly never starts processing", async () => {
  const run = setup({ readOnly: true });
  await run.session.process();
  assert.deepEqual(run.calls, []);
});

test("RequiresReview is success, not an error", async () => {
  const run = setup({ processRequirement: async () => ({ outcome: "RequiresReview" }) as ProcessedRequirement });
  await run.session.process();
  assert.equal(run.refreshes, 1);
  assert.equal(run.changes.at(-1)?.error, null);
});

test("already active starts polling instead of reporting failure", async () => {
  const run = setup({ processRequirement: async () => { throw "already-active"; } });
  await run.session.process();
  assert.equal(run.changes.at(-1)?.status, "PROCESSING");
  assert.equal(run.changes.at(-1)?.error, null);
  assert.equal(run.hasTimer, true);
});

test("PROCESSING polls the existing prequote, stops and refreshes on PROCESSED", async () => {
  const run = setup({ status: "PROCESSING", getCurrentRequirement: async (id) => {
    assert.equal(id, "prequote-1");
    return { requirementId: "requirement-1", status: "PROCESSED", hasTechnicalProposal: true } as CurrentRequirement;
  } });
  run.session.startPolling();
  await run.session.process();
  assert.deepEqual(run.calls, []);
  await run.tick();
  assert.equal(run.refreshes, 1);
  assert.equal(run.hasTimer, false);
});

test("FAILED allows retry on the same requirement", async () => {
  const run = setup({ status: "FAILED" });
  await run.session.process();
  assert.deepEqual(run.calls, ["requirement-1"]);
});

test("cancelled, superseded and processed requirements are never reprocessed", async () => {
  for (const status of ["CANCELLED", "SUPERSEDED", "PROCESSED"]) {
    const run = setup({ status });
    run.session.startPolling();
    await run.session.process();
    assert.deepEqual(run.calls, []);
    assert.equal(run.hasTimer, false);
    assert.equal(run.refreshes, 0);
  }
});

test("double clicks cannot submit twice; no poll races a pending POST", async () => {
  let finish!: (value: ProcessedRequirement) => void;
  let count = 0;
  const run = setup({ processRequirement: () => {
    count++;
    return new Promise((resolve) => { finish = resolve; });
  } });
  const first = run.session.process();
  await run.session.process();
  assert.equal(count, 1);
  assert.equal(run.hasTimer, false);
  finish({ outcome: "Completed" } as ProcessedRequirement);
  await first;
});

test("unmount/project change ignores late POST completion", async () => {
  let finish!: (value: ProcessedRequirement) => void;
  const run = setup({ processRequirement: () => new Promise((resolve) => { finish = resolve; }) });
  const pending = run.session.process();
  run.session.dispose();
  finish({ outcome: "Completed" } as ProcessedRequirement);
  await pending;
  assert.equal(run.refreshes, 0);
  assert.equal(run.changes.length, 1);
  assert.equal(run.hasTimer, false);
});

test("polling stops at FAILED/CANCELLED/SUPERSEDED and cleanup removes timers", async () => {
  for (const status of ["FAILED", "CANCELLED", "SUPERSEDED"]) {
    const run = setup({ status: "PROCESSING", getCurrentRequirement: async () => ({ requirementId: "requirement-1", status }) as CurrentRequirement });
    run.session.startPolling();
    await run.tick();
    assert.equal(run.hasTimer, false);
    assert.equal(run.changes.at(-1)?.status, status);
  }
  const run = setup({ status: "PROCESSING" });
  run.session.startPolling();
  run.session.dispose();
  assert.equal(run.hasTimer, false);
});

test("API error preserves the last known state instead of fabricating Failed", async () => {
  const run = setup({ processRequirement: async () => { throw new Error("private detail"); } });
  await run.session.process();
  assert.equal(run.changes.at(-1)?.status, "PENDING");
  assert.equal(run.changes.at(-1)?.error, "Mensaje amigable");
  assert.equal(run.refreshes, 0);
});

test("late polling response after disposal cannot update or refresh", async () => {
  let finish!: (value: CurrentRequirement) => void;
  const run = setup({ status: "PROCESSING", getCurrentRequirement: () => new Promise((resolve) => { finish = resolve; }) });
  run.session.startPolling();
  await run.tick();
  run.session.dispose();
  finish({ requirementId: "requirement-1", status: "PROCESSED" } as CurrentRequirement);
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(run.refreshes, 0);
  assert.deepEqual(run.changes, []);
});
