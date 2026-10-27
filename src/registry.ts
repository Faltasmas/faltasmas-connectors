export interface RegistryEntry {
  id: string;
  name: string;
  version: string;
  bundleUrl: string;
  sha256: string;
  institutionCount: number;
}
export interface Registry {
  connectors: RegistryEntry[];
}

const SHA256_HEX = /^[0-9a-fA-F]{64}$/;

function fail(msg: string): never {
  throw new Error(msg);
}
function str(v: unknown, field: string): string {
  if (typeof v !== "string" || v.length === 0) fail(`${field} must be a non-empty string`);
  return v;
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyBundle(bytes: Uint8Array, expectedSha256: string): Promise<void> {
  const actual = await sha256Hex(bytes);
  if (actual !== expectedSha256.toLowerCase()) throw new Error("bundle hash mismatch");
}

export function parseRegistry(input: unknown): Registry {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    fail("registry must be an object");
  }
  const list = (input as Record<string, unknown>).connectors;
  if (!Array.isArray(list)) fail("registry.connectors must be an array");

  const seen = new Set<string>();
  const connectors = list.map((raw, i): RegistryEntry => {
    const f = `registry.connectors[${i}]`;
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) fail(`${f} must be an object`);
    const o = raw as Record<string, unknown>;
    const id = str(o.id, `${f}.id`);
    if (seen.has(id)) fail(`registry.connectors has duplicate id "${id}"`);
    seen.add(id);
    const sha256 = str(o.sha256, `${f}.sha256`);
    if (!SHA256_HEX.test(sha256)) fail(`${f}.sha256 must be 64 hex characters`);
    const count = o.institutionCount;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      fail(`${f}.institutionCount must be an integer >= 0`);
    }
    return {
      id,
      name: str(o.name, `${f}.name`),
      version: str(o.version, `${f}.version`),
      bundleUrl: str(o.bundleUrl, `${f}.bundleUrl`),
      sha256: sha256.toLowerCase(),
      institutionCount: count,
    };
  });
  return { connectors };
}

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function searchRegistry(registry: Registry, query: string): RegistryEntry[] {
  const q = fold(query.trim());
  return registry.connectors.filter((e) => fold(e.name).includes(q));
}
