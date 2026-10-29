import {
  getAccessToken,
  notifyUnauthorized,
  removeAccessToken,
} from "@/features/auth/auth-storage";
import { ApiError, type ApiProblemDetails } from "@/lib/http/api-error";

interface ApiRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  authenticated?: boolean;
  signal?: AbortSignal;
}

export interface ApiDownload {
  blob: Blob;
  contentDisposition: string | null;
}

// Exact document GET; JSON and Excel consumers keep their existing contracts.
export async function apiGetDocument(path: string, signal: AbortSignal): Promise<ApiDownload> {
  const token = getAccessToken();
  const checkCurrent = () => {
    signal.throwIfAborted();
    if (getAccessToken() !== token) throw new DOMException("Session changed", "AbortError");
  };
  checkCurrent();
  const headers = new Headers({ Accept: "application/octet-stream, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, image/jpeg, image/png" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(buildUrl(path), { method: "GET", headers, signal, cache: "no-store", redirect: "error" });
  checkCurrent();
  if (!response.ok) {
    const problemDetails = toProblemDetails(await readResponseBody(response).catch(() => undefined));
    checkCurrent();
    if (response.status === 401) { removeAccessToken(); notifyUnauthorized(); }
    throw new ApiError({ status: response.status, title: "Documento no disponible", detail: "No fue posible descargar el documento.", problemDetails });
  }
  const mime = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (response.status !== 200 || !["application/pdf", "application/octet-stream", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/jpeg", "image/png"].includes(mime ?? "")) {
    await response.body?.cancel();
    throw new ApiError({ status: 0, title: "Respuesta inválida", detail: "El servidor no devolvió un documento válido." });
  }
  const blob = await response.blob();
  checkCurrent();
  if (!blob.size || blob.size > 20 * 1024 * 1024) throw new ApiError({ status: 0, title: "Respuesta inválida", detail: "El tamaño del documento no es válido." });
  return { blob, contentDisposition: response.headers.get("content-disposition") };
}

// Binary GET shares the existing credentials and unauthorized notification, not a new auth flow.
export async function apiGetImage(path: string, signal: AbortSignal): Promise<Blob | null> {
  const token = getAccessToken();
  const checkCurrent = () => {
    signal.throwIfAborted();
    if (getAccessToken() !== token) throw new DOMException("Session changed", "AbortError");
  };
  checkCurrent();
  const headers = new Headers({ Accept: "image/jpeg, image/png" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(buildUrl(path), { method: "GET", headers, signal, cache: "no-store", redirect: "error" });
  } catch (error) {
    checkCurrent();
    if (error instanceof ApiError) throw error;
    throw new ApiError({ status: 0, title: "Error de conexion", detail: NETWORK_ERROR_MESSAGE });
  }
  checkCurrent();
  if (response.status === 204) return null;
  if (!response.ok) {
    const problemDetails = toProblemDetails(await readResponseBody(response));
    checkCurrent();
    if (response.status === 401) { removeAccessToken(); notifyUnauthorized(); }
    throw new ApiError({ status: response.status, title: "Imagen no disponible",
      detail: "No fue posible consultar la imagen.", traceId: problemDetails?.traceId, problemDetails });
  }
  const mime = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (response.status !== 200 || (mime !== "image/jpeg" && mime !== "image/png")) {
    await response.body?.cancel();
    throw new ApiError({ status: 0, title: "Respuesta invalida", detail: "La respuesta no es una imagen compatible." });
  }
  const blob = await response.blob();
  checkCurrent();
  if (!blob.size) throw new ApiError({ status: 0, title: "Respuesta invalida", detail: "La imagen esta vacia." });
  return blob;
}

const NETWORK_ERROR_MESSAGE =
  "No fue posible conectar con el servidor. Verifica que el backend esté disponible.";
const CONFIGURATION_ERROR_MESSAGE =
  "La aplicación no está configurada para comunicarse con el servidor.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toProblemDetails(value: unknown): ApiProblemDetails | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const problem: ApiProblemDetails = {};
  if (typeof value.type === "string") problem.type = value.type;
  if (typeof value.title === "string") problem.title = value.title;
  if (typeof value.status === "number") problem.status = value.status;
  if (typeof value.detail === "string") problem.detail = value.detail;
  if (typeof value.instance === "string") problem.instance = value.instance;
  if ("code" in value) problem.code = value.code;
  if ("errorCode" in value) problem.errorCode = value.errorCode;
  if (typeof value.traceId === "string") problem.traceId = value.traceId;

  if (isRecord(value.errors)) {
    const errors: Record<string, string[]> = {};
    for (const [key, messages] of Object.entries(value.errors)) {
      if (Array.isArray(messages) && messages.every((item) => typeof item === "string")) {
        errors[key] = messages;
      }
    }
    problem.errors = errors;
  }

  return problem;
}

function isJsonResponse(contentType: string): boolean {
  const mediaType = contentType
    .split(";", 1)[0]
    .trim()
    .toLowerCase();

  return mediaType === "application/json" || mediaType.endsWith("+json");
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!isJsonResponse(contentType)) {
    return text;
  }

  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return undefined;
  }
}

function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configuredUrl) {
    throw new ApiError({
      status: 0,
      title: "Configuración incompleta",
      detail: CONFIGURATION_ERROR_MESSAGE,
    });
  }

  return configuredUrl.replace(/\/+$/, "");
}

function buildUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new ApiError({
      status: 0,
      title: "Ruta de API inválida",
      detail: "No fue posible preparar la solicitud al servidor.",
    });
  }

  return `${getApiBaseUrl()}${path}`;
}

function isFormDataBody(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function prepareRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (isFormDataBody(body)) {
    return body;
  }

  return JSON.stringify(body);
}

export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<unknown> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (isFormDataBody(options.body)) {
    headers.delete("Content-Type");
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.authenticated) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const requestBody = prepareRequestBody(options.body);

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: options.method ?? "GET",
      headers,
      body: requestBody,
      signal: options.signal,
    });
  } catch (error: unknown) {
    if (options.signal?.aborted) throw error;
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError({
      status: 0,
      title: "Error de conexión",
      detail: NETWORK_ERROR_MESSAGE,
    });
  }

  const payload = await readResponseBody(response);

  if (!response.ok) {
    const problemDetails = toProblemDetails(payload);

    if (response.status === 401 && options.authenticated) {
      removeAccessToken();
      notifyUnauthorized();
    }

    throw new ApiError({
      status: response.status,
      title: problemDetails?.title ?? `Error HTTP ${response.status}`,
      detail: problemDetails?.detail ?? "El servidor no pudo completar la solicitud.",
      traceId: problemDetails?.traceId,
      problemDetails,
    });
  }

  return payload;
}

export async function apiDownload(
  path: string,
  body: unknown,
): Promise<ApiDownload> {
  const headers = new Headers({
    Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Type": "application/json",
  });
  const accessToken = getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) throw error;
    throw new ApiError({
      status: 0,
      title: "Error de conexión",
      detail: NETWORK_ERROR_MESSAGE,
    });
  }

  if (!response.ok) {
    const payload = await readResponseBody(response);
    const problemDetails = toProblemDetails(payload);
    if (response.status === 401) {
      removeAccessToken();
      notifyUnauthorized();
    }
    throw new ApiError({
      status: response.status,
      title: problemDetails?.title ?? `Error HTTP ${response.status}`,
      detail: problemDetails?.detail ?? "El servidor no pudo completar la solicitud.",
      traceId: problemDetails?.traceId,
      problemDetails,
    });
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
    throw new ApiError({ status: 0, title: "Respuesta inválida", detail: "El servidor no devolvió un archivo Excel válido." });
  }

  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get("content-disposition"),
  };
}
