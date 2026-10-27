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
export type ConnectorErrorCode =
  | "invalid_credentials"
  | "session_expired"
  | "unsupported_account"
  | "unexpected_response";

export class ConnectorError extends Error {
  constructor(public code: ConnectorErrorCode, message: string) {
    super(message);
    this.name = "ConnectorError";
    Object.setPrototypeOf(this, ConnectorError.prototype);
  }
}
