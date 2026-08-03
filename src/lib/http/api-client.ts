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
    });
  } catch (error: unknown) {
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
