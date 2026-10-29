import assert from "node:assert/strict";
import test from "node:test";

import { ApiError, type ApiProblemDetails } from "@/lib/http/api-error";
import { getConfigurationDraftFailure } from "./project-configuration-draft-error";

function apiError(status: number, problemDetails?: ApiProblemDetails, detail = "Technical detail") {
  return new ApiError({ status, title: "Technical title", detail, problemDetails });
}

test("structured conflict keeps its treatment when translated detail changes and the UI copy has no version keyword", () => {
  const failures = ["Hay una versión más reciente", "Priorities changed", "C:\\internal\\trace"]
    .map((detail) => getConfigurationDraftFailure(apiError(409, {
      errorCode: "REQUIREMENT_EXPERIENCE_CONFLICT", detail,
    }, detail)));

  for (const failure of failures) {
    assert.equal(failure.status, "conflict");
    assert.doesNotMatch(failure.message, /versi[oó]n/i);
    assert.deepEqual(failure, failures[0]);
  }
});

test("the existing code alias also identifies a conflict independently of HTTP status", () => {
  assert.equal(getConfigurationDraftFailure(apiError(400, {
    code: "REQUIREMENT_EXPERIENCE_CONFLICT",
  })).status, "conflict");
});

test("other or missing 409 codes do not receive draft revision conflict treatment", () => {
  for (const code of [undefined, "REQUIREMENT_EXPERIENCE_CONFIGURATION_BLOCKED", "UNKNOWN_CONFLICT"]) {
    const failure = getConfigurationDraftFailure(apiError(409, { errorCode: code }, "Hay una versión más reciente"));
    assert.equal(failure.status, "error");
  }
});

test("a misleading translated error cannot override the structured errorCode", () => {
  assert.equal(getConfigurationDraftFailure(apiError(409, {
    errorCode: "UNKNOWN_CONFLICT", code: "REQUIREMENT_EXPERIENCE_CONFLICT",
  }, "Hay una versión más reciente")).status, "error");
});

test("unknown errors never expose technical details and leave the original error intact", () => {
  const detail = "Stack trace at C:\\internal\\service.ts:42";
  const original = apiError(502, { detail, errorCode: "UNKNOWN", traceId: "trace-1" }, detail);
  const failure = getConfigurationDraftFailure(original);
  assert.equal(failure.status, "error");
  assert.doesNotMatch(failure.message, /Stack|internal|service|trace-1/);
  assert.equal(original.detail, detail);
  assert.equal(original.problemDetails?.traceId, "trace-1");
  assert.equal(getConfigurationDraftFailure(new Error(detail)).message, failure.message);
});

test("session, access, validation and saving failures remain distinct without reading backend detail", () => {
  const failures = [400, 401, 403, 500].map((status) => getConfigurationDraftFailure(apiError(status)));
  assert.equal(new Set(failures.map((failure) => failure.message)).size, 4);
  assert.ok(failures.every((failure) => failure.status === "error"));
});
