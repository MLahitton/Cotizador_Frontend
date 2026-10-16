import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { reconcilePhysicalDataDraft } from "./physical-data-draft";

const submitted = { quantity: "1", widthMm: "1000", heightMm: "2000" };
const response = { quantity: 1, widthMm: 1000, heightMm: 2000 };

test("unchanged inputs synchronize and become clean", () => {
  const result = reconcilePhysicalDataDraft(submitted, submitted, response, 1, 1);
  assert.deepEqual(result, { draft: submitted, baseline: submitted, dirty: false });
});

for (const [field, value] of Object.entries({ widthMm: "1200", quantity: "2", heightMm: "2400" })) {
  test(`preserves ${field} edited after submit as dirty`, () => {
    const current = { ...submitted, [field]: value };
    const result = reconcilePhysicalDataDraft(submitted, current, response, 1, 1);
    assert.deepEqual(result?.draft, current);
    assert.deepEqual(result?.baseline, submitted);
    assert.equal(result?.dirty, true);
  });
}

test("reconciles independent fields including server-normalized values", () => {
  const sent = { quantity: "01", widthMm: "1000", heightMm: "" };
  const result = reconcilePhysicalDataDraft(sent, { ...sent, widthMm: "1200" }, response, 1, 1);
  assert.deepEqual(result?.draft, { quantity: "1", widthMm: "1200", heightMm: "2000" });
  assert.equal(result?.dirty, true);
});

test("late response A cannot replace accepted response B", () => {
  const second = { ...submitted, widthMm: "1200" };
  const accepted = reconcilePhysicalDataDraft(second, second, { ...response, widthMm: 1200 }, 2, 2);
  assert.equal(accepted?.dirty, false);
  assert.equal(reconcilePhysicalDataDraft(submitted, accepted!.draft, response, 1, 2), null);
  assert.equal(accepted?.draft.widthMm, "1200");
});

test("does not mutate submitted/current inputs or unrelated drafts", () => {
  const drafts = Object.freeze({ priorities: Object.freeze({ UV: "UV_YES" }), location: "Local", observation: "Nota" });
  const current = Object.freeze({ ...submitted, widthMm: "1200" });
  const sent = Object.freeze({ ...submitted });
  const result = reconcilePhysicalDataDraft(sent, current, response, 1, 1);
  assert.deepEqual(current, { ...submitted, widthMm: "1200" });
  assert.deepEqual(sent, submitted);
  assert.deepEqual(drafts, { priorities: { UV: "UV_YES" }, location: "Local", observation: "Nota" });
  assert.deepEqual(Object.keys(result!.draft).sort(), ["heightMm", "quantity", "widthMm"]);
});

test("edits equal to the new baseline remain clean without rewriting their text", () => {
  const result = reconcilePhysicalDataDraft(submitted, { ...submitted, widthMm: "01000" }, response, 1, 1);
  assert.equal(result?.draft.widthMm, "01000");
  assert.equal(result?.dirty, false);
});

test("cleared or invalid newer input is preserved as dirty", () => {
  for (const widthMm of ["", "invalid"]) {
    const result = reconcilePhysicalDataDraft(submitted, { ...submitted, widthMm }, response, 1, 1);
    assert.equal(result?.draft.widthMm, widthMm);
    assert.equal(result?.dirty, true);
  }
});

test("savePhysical preserves newer inputs and other drafts while preventing overlapping saves", async () => {
  // Exercise the actual callback with a deferred API response, without mounting the page.
  const source = readFileSync("src/features/projects/components/project-item-detail-page-content.tsx", "utf8");
  const prefix = "  const savePhysical = useCallback(async () => {";
  const start = source.indexOf(prefix);
  assert.ok(start >= 0);
  const end = source.indexOf("\n  }, [applyItemPhysicalUpdate", start);
  assert.ok(end > start);
  const body = source.slice(start + prefix.length, end);
  const state = { ...submitted, status: "idle", priorities: "UV_YES", location: "Local", observation: "Nota" };
  let finish!: (value: typeof response) => void;
  let calls = 0;
  let refetches = 0;
  const pending = new Promise<typeof response>((resolve) => { finish = resolve; });
  const physicalDraft = { current: { ...submitted } };
  const dependencies = {
    proposal: { technicalProposalId: "proposal" }, item: { itemId: "item" },
    physicalDraft, physicalSaving: { current: false }, physicalRequestId: { current: 0 },
    parsePositiveInteger: Number, reconcilePhysicalDataDraft,
    setPhysicalError: () => {}, setPhysicalStatus: (value: string) => { state.status = value; },
    updateTechnicalProposalItemPhysicalData: () => { calls += 1; return pending; },
    applyItemPhysicalUpdate: () => {}, retryProposal: () => { refetches += 1; },
    setQuantityInput: (value: string) => { state.quantity = value; },
    setWidthInput: (value: string) => { state.widthMm = value; },
    setHeightInput: (value: string) => { state.heightMm = value; },
  };
  const save = new Function(...Object.keys(dependencies), `return async () => {${body}}`)(...Object.values(dependencies)) as () => Promise<void>;
  const saving = save();
  state.widthMm = "1200";
  physicalDraft.current.widthMm = "1200";
  await save();
  assert.equal(calls, 1);
  finish(response);
  await saving;
  assert.deepEqual(state, { ...submitted, widthMm: "1200", status: "dirty", priorities: "UV_YES", location: "Local", observation: "Nota" });
  assert.equal(refetches, 1);
  assert.equal(dependencies.physicalSaving.current, false);
});
