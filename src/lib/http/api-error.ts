export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: unknown;
  traceId?: string;
  errors?: Record<string, string[]>;
}

interface ApiErrorOptions {
  status: number;
  title: string;
  detail: string;
  traceId?: string;
  problemDetails?: ApiProblemDetails;
}

export class ApiError extends Error {
  readonly status: number;
  readonly title: string;
  readonly detail: string;
  readonly traceId?: string;
  readonly problemDetails?: ApiProblemDetails;

  constructor(options: ApiErrorOptions) {
    super(options.detail);
    this.name = "ApiError";
    this.status = options.status;
    this.title = options.title;
    this.detail = options.detail;
    this.traceId = options.traceId;
    this.problemDetails = options.problemDetails;
  }
}
