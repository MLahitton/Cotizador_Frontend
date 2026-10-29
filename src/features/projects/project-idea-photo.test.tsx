import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { apiGetImage, apiRequest } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";
import { saveAccessToken, getAccessToken } from "@/features/auth/auth-storage";
import { createProjectIdeaPhotoQuery, type ProjectIdeaPhotoState } from "./project-idea-photo-query";
import { ProjectIdeaPhotoView } from "./components/project-idea-photo";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((yes) => { resolve = yes; });
  return { promise, resolve };
}
function harness(read: (id: string, signal: AbortSignal) => Promise<Blob | null>, id = "project-A") {
  const states: ProjectIdeaPhotoState[] = [];
  const created: string[] = [], revoked: string[] = [];
  const query = createProjectIdeaPhotoQuery(id, (state) => states.push(state), read, {
    create: () => { const url = `blob:fixture-${created.length}`; created.push(url); return url; },
    revoke: (url) => revoked.push(url),
  });
  return { query, states, created, revoked };
}
const blob = () => new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
const render = (state: ProjectIdeaPhotoState) => renderToStaticMarkup(createElement(ProjectIdeaPhotoView,
  { state, onRetry() {}, onImageError() {}, onReferenceError() {} }));

test("only explicit 204/null selects the reference asset; loading never anticipates absence", async () => {
  const h = harness(async () => null);
  await h.query.load();
  assert.deepEqual(h.states, [{ status: "loading" }, { status: "reference" }]);
  assert.match(render(h.states[1]), /\/images\/project-reference.webp/);
  assert.match(render(h.states[1]), /Imagen de referencia/);
  for (const status of ["loading", "error", "authentication", "unavailable", "reference-error"] as const) {
    assert.doesNotMatch(render({ status }), /<img|project-reference.webp/);
  }
  assert.deepEqual(h.created, []);
  h.query.dispose();
});

test("a valid photo keeps its object URL alive until discard, then revokes exactly once", async () => {
  const h = harness(async (id) => { assert.equal(id, "project-A"); return blob(); });
  await h.query.load();
  assert.deepEqual(h.revoked, []);
  assert.match(render(h.states.at(-1)!), /Imagen compartida por el cliente/);
  assert.match(render(h.states.at(-1)!), /object-contain/);
  await h.query.load();
  assert.deepEqual(h.revoked, [h.created[0]]);
  h.query.dispose(); h.query.dispose();
  assert.deepEqual(h.revoked, h.created);
});

test("late A never publishes into B even if transport ignores abort", async () => {
  const late = deferred<Blob | null>();
  let signal!: AbortSignal;
  const a = harness(async (_id, s) => { signal = s; return late.promise; });
  const pending = a.query.load(); a.query.dispose();
  const b = harness(async () => blob(), "project-B"); await b.query.load();
  late.resolve(blob()); await pending;
  assert.equal(signal.aborted, true);
  assert.deepEqual(a.states, [{ status: "loading" }]); assert.deepEqual(a.created, []);
  assert.equal(b.states.at(-1)?.status, "photo"); assert.deepEqual(b.revoked, []);
  b.query.dispose();
});

test("unmount or session replacement cancels a pending read without publishing an error", async () => {
  const late = deferred<Blob | null>();
  const h = harness((_id, signal) => { signal.addEventListener("abort", () => late.resolve(blob())); return late.promise; });
  const work = h.query.load(); h.query.dispose(); await work; await h.query.load();
  assert.deepEqual(h.states, [{ status: "loading" }]); assert.deepEqual(h.created, []);
});

test("manual reload cancels older work and cannot be overwritten by its late result", async () => {
  const old = deferred<Blob | null>(); let calls = 0;
  const h = harness(async () => ++calls === 1 ? old.promise : blob());
  const pending = h.query.load(); await h.query.load(); old.resolve(null); await pending;
  assert.equal(calls, 2); assert.equal(h.states.at(-1)?.status, "photo");
  assert.equal(h.created.length, 1); h.query.dispose();
});

for (const [status, expected] of [[401, "authentication"], [403, "unavailable"], [404, "unavailable"], [500, "error"], [0, "error"]] as const) {
  test(`HTTP ${status} stays distinct from absence and only recoverable errors offer manual retry`, async () => {
    const h = harness(async () => { throw new ApiError({ status, title: "secret", detail: "private path" }); });
    await h.query.load(); assert.equal(h.states.at(-1)?.status, expected);
    const html = render(h.states.at(-1)!);
    assert.doesNotMatch(html, /private path|secret|project-reference.webp/);
    assert.equal(html.includes("Volver a cargar"), expected === "error");
    h.query.dispose();
  });
}

test("network error retries only on explicit load", async () => {
  let calls = 0;
  const h = harness(async () => { if (++calls === 1) throw new TypeError("network"); return blob(); });
  await h.query.load(); assert.equal(calls, 1); assert.equal(h.states.at(-1)?.status, "error");
  await h.query.load(); assert.equal(calls, 2); assert.equal(h.states.at(-1)?.status, "photo"); h.query.dispose();
});

test("visual decode failure revokes the failing URL, never loops or revokes a later active URL", async () => {
  const h = harness(async () => blob()); await h.query.load();
  const old = h.created[0]; h.query.imageFailed(old); h.query.imageFailed(old);
  assert.equal(h.states.at(-1)?.status, "error"); assert.deepEqual(h.revoked, [old]);
  await h.query.load(); h.query.imageFailed(old);
  assert.equal(h.states.at(-1)?.status, "photo"); assert.deepEqual(h.revoked, [old]); h.query.dispose();
});

test("static asset failure produces a neutral placeholder once, without another GET", async () => {
  let calls = 0;
  const h = harness(async () => { calls++; return null; }); await h.query.load();
  h.query.referenceFailed(); h.query.referenceFailed();
  assert.equal(calls, 1); assert.equal(h.states.length, 3);
  assert.match(render(h.states.at(-1)!), /Imagen de referencia no disponible/);
  assert.doesNotMatch(render(h.states.at(-1)!), /<img|<button/); h.query.dispose();
});

// Browser API shims are local to each transport test; no real token, API or project is used.
async function transport(run: (events: Event[]) => Promise<void>) {
  const previous = { window: Object.getOwnPropertyDescriptor(globalThis, "window"), fetch: globalThis.fetch, base: process.env.NEXT_PUBLIC_API_BASE_URL };
  const values = new Map<string, string>(); const events: Event[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    sessionStorage: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => values.set(k, v), removeItem: (k: string) => values.delete(k) },
    dispatchEvent: (event: Event) => { events.push(event); return true; },
  } });
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test"; saveAccessToken("test-token");
  try { await run(events); } finally {
    globalThis.fetch = previous.fetch;
    if (previous.window) Object.defineProperty(globalThis, "window", previous.window); else Reflect.deleteProperty(globalThis, "window");
    if (previous.base === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL; else process.env.NEXT_PUBLIC_API_BASE_URL = previous.base;
  }
}

for (const mime of ["image/jpeg", "image/png"]) test(`binary ${mime} uses existing bearer, GET/no-store/no redirect and preserves bytes`, () => transport(async () => {
  const bytes = new Uint8Array([10, 20, 30]);
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.example.test/api/v2/projects/id/idea-photo");
    assert.equal(options?.method, "GET"); assert.equal(options?.cache, "no-store"); assert.equal(options?.redirect, "error");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer test-token"); assert.equal(options?.body, undefined);
    return new Response(bytes, { headers: { "content-type": mime } });
  };
  const result = await apiGetImage("/api/v2/projects/id/idea-photo", new AbortController().signal);
  assert.equal(result?.type, mime); assert.deepEqual(new Uint8Array(await result!.arrayBuffer()), bytes);
}));

test("204 is handled without reading blob or JSON", () => transport(async () => {
  const response = new Response(null, { status: 204 });
  response.blob = async () => { throw new Error("must not read"); };
  response.text = async () => { throw new Error("must not read"); };
  globalThis.fetch = async () => response;
  assert.equal(await apiGetImage("/photo", new AbortController().signal), null);
}));

for (const invalid of ["mime", "empty", "partial"]) test(`rejects invalid 200/206 response: ${invalid}`, () => transport(async () => {
  globalThis.fetch = async () => new Response(invalid === "empty" ? null : "bytes", { status: invalid === "partial" ? 206 : 200,
    headers: { "content-type": invalid === "mime" ? "text/html" : "image/png" } });
  await assert.rejects(apiGetImage("/photo", new AbortController().signal), ApiError);
}));

test("401 uses central session expiry exactly once", () => transport(async (events) => {
  globalThis.fetch = async () => new Response(null, { status: 401 });
  await assert.rejects(apiGetImage("/photo", new AbortController().signal), (e: unknown) => e instanceof ApiError && e.status === 401);
  assert.equal(getAccessToken(), null); assert.equal(events.length, 1);
}));

test("late old-session 401 cannot log out the new user", () => transport(async (events) => {
  const late = deferred<Response>(); globalThis.fetch = () => late.promise;
  const pending = apiGetImage("/photo", new AbortController().signal);
  saveAccessToken("new-session"); late.resolve(new Response(null, { status: 401 }));
  await assert.rejects(pending, (e: unknown) => e instanceof DOMException && e.name === "AbortError");
  assert.equal(getAccessToken(), "new-session"); assert.equal(events.length, 0);
}));

test("aborted read ignores late 200 even when fetch ignores abort", () => transport(async () => {
  const late = deferred<Response>(); globalThis.fetch = () => late.promise;
  const cancel = new AbortController(); const pending = apiGetImage("/photo", cancel.signal);
  cancel.abort(); late.resolve(new Response("bytes", { headers: { "content-type": "image/png" } }));
  await assert.rejects(pending, (e: unknown) => e instanceof DOMException && e.name === "AbortError");
}));

test("existing JSON consumers retain their response and request behavior", () => transport(async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(new Headers(options?.headers).get("Accept"), "application/json");
    assert.equal(options?.cache, undefined);
    return new Response('{"unchanged":true}', { headers: { "content-type": "application/json" } });
  };
  assert.deepEqual(await apiRequest("/existing", { authenticated: true }), { unchanged: true });
}));
