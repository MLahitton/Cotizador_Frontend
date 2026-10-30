import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function locationHarness(canEditCommercial = true) {
  const source = readFileSync("src/features/projects/components/project-item-detail-page-content.tsx", "utf8");
  const prefix = "  const saveLocation = useCallback(async (nextLocation: string | null) => {";
  const start = source.indexOf(prefix);
  const end = source.indexOf("\n  }, [applyItemLocationUpdate", start);
  assert.ok(start >= 0 && end > start);
  let finish!: (value: object) => void;
  let fail!: (error: Error) => void;
  const pending = new Promise<object>((resolve, reject) => { finish = resolve; fail = reject; });
  const state = { calls: 0, applies: 0, editing: true, status: "idle", input: "Nuevo", error: "", physicalDirty: false, token: "fixture" };
  const deps = {
    proposal: { technicalProposalId: "proposal" }, item: { itemId: "item" }, canEditCommercial,
    locationSaving: { current: false }, physicalSaving: { current: false }, physicalRequestId: { current: 0 },
    locationDraft: { current: "Nuevo" }, commercialBaseline: { current: { location: "Anterior" } },
    getAccessToken: () => state.token,
    setLocationStatus: (value: string) => { state.status = value; },
    setLocationError: (value: string) => { state.error = value; },
    setLocationInput: (value: string) => { state.input = value; },
    setCommercialEditing: (value: boolean) => { state.editing = value; },
    updateTechnicalProposalItemLocation: () => { state.calls++; return pending; },
    applyItemLocationUpdate: () => { state.applies++; },
    getTechnicalProposalItemLocationErrorMessage: () => "Error de prueba",
    locationHasChanges: () => deps.locationDraft.current !== deps.commercialBaseline.current.location,
    physicalHasChanges: () => state.physicalDirty,
  };
  const body = source.slice(start + prefix.length, end);
  const save = new Function(...Object.keys(deps), `return async nextLocation => {${body}}`)(...Object.values(deps)) as (value: string) => Promise<void>;
  const response = { technicalProposalId: "proposal", itemId: "item", effectiveLocation: "Nuevo" };
  return { state, deps, save, finish, fail, response };
}

test("location save excludes duplicate sends and returns to reading when both groups are clean", async () => {
  const h = locationHarness(); const pending = h.save("Nuevo");
  await h.save("Nuevo"); assert.equal(h.state.calls, 1);
  h.finish(h.response); await pending;
  assert.equal(h.state.editing, false); assert.equal(h.state.applies, 1);
  assert.equal(h.deps.locationSaving.current, false);
});

test("saving location preserves pending dimensions and later local location edits", async () => {
  const h = locationHarness(); h.state.physicalDirty = true;
  const pending = h.save("Nuevo"); h.deps.locationDraft.current = "Edicion posterior";
  h.finish(h.response); await pending;
  assert.equal(h.state.editing, true); assert.equal(h.state.input, "Edicion posterior");
  assert.equal(h.state.status, "dirty"); assert.equal(h.deps.commercialBaseline.current.location, "Nuevo");
});

test("location error preserves form values without success or application", async () => {
  const h = locationHarness(); const pending = h.save("Nuevo");
  h.fail(new Error("fixture")); await pending;
  assert.equal(h.state.status, "error"); assert.equal(h.state.editing, true);
  assert.equal(h.state.input, "Nuevo"); assert.equal(h.state.applies, 0);
});

for (const reject of [false, true]) test(`old location ${reject ? "error" : "response"} cannot affect another context`, async () => {
  const h = locationHarness(); const pending = h.save("Nuevo");
  h.deps.physicalRequestId.current++;
  h.state.input = "Otro elemento"; h.state.status = "saving";
  h.deps.locationSaving.current = true;
  if (reject) h.fail(new Error("old")); else h.finish(h.response);
  await pending;
  assert.equal(h.state.input, "Otro elemento"); assert.equal(h.state.status, "saving");
  assert.equal(h.state.applies, 0); assert.equal(h.deps.locationSaving.current, true);
});

test("a token change discards a retained result and releases its own busy state", async () => {
  const h = locationHarness(); const pending = h.save("Nuevo"); h.state.token = "new";
  h.finish(h.response); await pending;
  assert.equal(h.state.applies, 0); assert.equal(h.deps.locationSaving.current, false);
  assert.equal(h.state.status, "error");
});

test("read-only capability refuses location writes", async () => {
  const h = locationHarness(false); await h.save("Nuevo");
  assert.equal(h.state.calls, 0); assert.equal(h.state.status, "idle");
});
