import assert from "node:assert/strict";
import test from "node:test";
import { apiGetDocument } from "@/lib/http/api-client";
import { ApiError } from "@/lib/http/api-error";
import { getAccessToken, saveAccessToken } from "@/features/auth/auth-storage";
import { createDocumentDownload, documentDownloadName } from "./project-document-download";

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
const binary = () => ({ blob: new Blob(["document bytes"], { type: "application/pdf" }), contentDisposition: "attachment; filename*=UTF-8''plano%20%C3%B1.pdf" });

test("document download exact identity, single in-flight call and manual retry", async () => {
  const late = deferred<ReturnType<typeof binary>>(); const states: string[] = []; const saved: string[] = []; let calls = 0;
  const download = createDocumentDownload("req/A", "file/B", "fallback.pdf", s => states.push(s), {
    token: () => "session", load: async (path) => { calls++; assert.equal(path, "/api/v2/requirements/req%2FA/documents/file%2FB/download"); return late.promise; },
    save: (_, name) => { saved.push(name); },
  });
  const first = download.start(); await download.start(); assert.equal(calls, 1);
  late.resolve(binary()); await first;
  assert.deepEqual(saved, ["plano ñ.pdf"]); assert.deepEqual(states, ["busy", "idle"]);
  await download.start(); assert.equal(calls, 2); download.dispose();
});

for (const reason of ["dispose", "session"]) test(`late download ignored on ${reason}, even if fetch ignores abort`, async () => {
  const late = deferred<ReturnType<typeof binary>>(); let token = "old"; let saved = 0; let signal!: AbortSignal;
  const download = createDocumentDownload("req", "file", "f.pdf", () => {}, {
    token: () => token, load: async (_, s) => { signal = s; return late.promise; }, save: () => { saved++; },
  });
  const pending = download.start(); if (reason === "dispose") download.dispose(); else token = "new";
  late.resolve(binary()); await pending; assert.equal(saved, 0);
  if (reason === "dispose") assert.equal(signal.aborted, true);
  download.dispose();
});

test("download error does not save; retry only on explicit start", async () => {
  let calls = 0; let saved = 0; const states: string[] = [];
  const download = createDocumentDownload("r", "f", "f.pdf", s => states.push(s), {
    token: () => "session", load: async () => { if (++calls === 1) throw new Error("network"); return binary(); }, save: () => { saved++; },
  });
  await download.start(); assert.equal(calls, 1); assert.equal(saved, 0); assert.equal(states.at(-1), "error");
  await download.start(); assert.equal(saved, 1); download.dispose();
});

test("safe download names reject paths, control characters and malformed encoding", () => {
  assert.equal(documentDownloadName('attachment; filename="../../a\\\\b.pdf"', "f.pdf"), "b.pdf");
  assert.equal(documentDownloadName("attachment; filename*=UTF-8''%ZZ", "f.pdf"), "f.pdf");
  assert.equal(documentDownloadName(null, "\r\n<>"), "documento");
  assert.equal(documentDownloadName(null, "\u202eabc.pdf"), "abc.pdf");
});

async function transport(run: (events: string[]) => Promise<void>) {
  const previous = { fetch: globalThis.fetch, window: Object.getOwnPropertyDescriptor(globalThis, "window"), base: process.env.NEXT_PUBLIC_API_BASE_URL };
  const store = new Map<string, string>(); const events: string[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    sessionStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value), removeItem: (key: string) => store.delete(key) },
    dispatchEvent: (event: Event) => { events.push(event.type); return true; },
  } });
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.test"; saveAccessToken("test-token");
  try { await run(events); } finally {
    globalThis.fetch = previous.fetch;
    if (previous.window) Object.defineProperty(globalThis, "window", previous.window); else Reflect.deleteProperty(globalThis, "window");
    if (previous.base === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL; else process.env.NEXT_PUBLIC_API_BASE_URL = previous.base;
  }
}

for (const mime of ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png", "application/octet-stream"])
  test(`authenticated document ${mime} preserves bytes`, () => transport(async () => {
    globalThis.fetch = async (path, options) => {
      assert.equal(path, "https://api.example.test/download"); assert.equal(options?.method, "GET");
      assert.equal(options?.cache, "no-store"); assert.equal(options?.redirect, "error");
      assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer test-token");
      return new Response("bytes", { headers: { "content-type": mime, "content-disposition": "attachment; filename=f.pdf" } });
    };
    const result = await apiGetDocument("/download", new AbortController().signal);
    assert.equal(await result.blob.text(), "bytes"); assert.equal(result.contentDisposition, "attachment; filename=f.pdf");
  }));

for (const status of [401, 403, 404, 500]) test(`HTTP ${status} is never downloaded as JSON`, () => transport(async () => {
  globalThis.fetch = async () => new Response('{"detail":"secret"}', { status, headers: { "content-type": "application/problem+json" } });
  await assert.rejects(apiGetDocument("/d", new AbortController().signal), (e: unknown) => e instanceof ApiError && e.status === status);
  assert.equal(getAccessToken(), status === 401 ? null : "test-token");
}));
for (const kind of ["json", "empty", "partial", "body-failure"]) test(`invalid download ${kind} rejected`, () => transport(async () => {
  globalThis.fetch = async () => {
    const response = new Response(kind === "empty" ? null : "bytes", { status: kind === "partial" ? 206 : 200, headers: { "content-type": kind === "json" ? "application/problem+json" : "application/pdf" } });
    if (kind === "body-failure") response.blob = async () => { throw new Error("truncated"); };
    return response;
  };
  await assert.rejects(apiGetDocument("/d", new AbortController().signal));
}));
test("old-session 401 cannot expire new session", () => transport(async events => {
  const late = deferred<Response>(); globalThis.fetch = () => late.promise;
  const pending = apiGetDocument("/d", new AbortController().signal); saveAccessToken("new"); late.resolve(new Response(null, { status: 401 }));
  await assert.rejects(pending, (e: unknown) => e instanceof DOMException && e.name === "AbortError");
  assert.equal(getAccessToken(), "new"); assert.equal(events.length, 0);
}));

test("401 still expires the current session when its error body is unreadable", () => transport(async () => {
  globalThis.fetch = async () => {
    const response = new Response(null, { status: 401 });
    response.text = async () => { throw new Error("broken error body"); };
    return response;
  };
  await assert.rejects(apiGetDocument("/d", new AbortController().signal), (e: unknown) => e instanceof ApiError && e.status === 401);
  assert.equal(getAccessToken(), null);
}));
