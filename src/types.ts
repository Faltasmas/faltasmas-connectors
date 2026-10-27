export interface HttpRequest {
  url: string;
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
}
export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}
export interface HttpClient {
  request(req: HttpRequest): Promise<HttpResponse>;
}
export interface CredentialField {
  key: string;
  label: string;
  secret: boolean;
}
export interface Institution {
  id: string;
  name: string;
}
export interface ConnectorManifest {
  id: string;
  name: string;
  version: string;
  allowedHosts: string[];
  credentialFields: CredentialField[];
  institutions: Institution[];
}
/** `totalHours` is cumulative school-year hours (not per quarter). */
export interface AbsenceReport {
  totalHours: number;
  subjects: { name: string; hours: number }[];
  syncedAt: string;
}
export interface ConnectorContext {
  http: HttpClient;
  credentials: Record<string, string>;
  institutionId: string;
}
export interface Connector {
  manifest: ConnectorManifest;
  fetchAbsences(ctx: ConnectorContext): Promise<AbsenceReport>;
}
export const CONNECTOR_ERROR_CODES = [
  "invalid_credentials",
  "session_expired",
  "unsupported_account",
  "unexpected_response",
] as const;
export type ConnectorErrorCode = (typeof CONNECTOR_ERROR_CODES)[number];

export class ConnectorError extends Error {
  constructor(public code: ConnectorErrorCode, message: string) {
    super(message);
    this.name = "ConnectorError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Duck-typed check. A bundle inlines its own ConnectorError class, so the
 * host's `instanceof` is false for errors thrown by a bundle; use this instead.
 */
export function isConnectorError(e: unknown): e is ConnectorError {
  if (typeof e !== "object" || e === null) return false;
  const o = e as { name?: unknown; code?: unknown };
  return (
    o.name === "ConnectorError" &&
    typeof o.code === "string" &&
    (CONNECTOR_ERROR_CODES as readonly string[]).includes(o.code)
  );
}
