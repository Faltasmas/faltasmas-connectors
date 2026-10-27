import type { AbsenceReport, ConnectorManifest } from "./types";

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
const HOST = /^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;
const HOURS_TOLERANCE = 0.01;

function fail(msg: string): never {
  throw new Error(msg);
}
function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown, field: string): string {
  if (typeof v !== "string" || v.length === 0) fail(`${field} must be a non-empty string`);
  return v;
}
function arr(v: unknown, field: string): unknown[] {
  if (!Array.isArray(v)) fail(`${field} must be an array`);
  return v;
}
function obj(v: unknown, field: string): Record<string, unknown> {
  if (!isObject(v)) fail(`${field} must be an object`);
  return v;
}
function hours(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
    fail(`${field} must be a finite number >= 0`);
  }
  return v;
}

export function validateManifest(input: unknown): ConnectorManifest {
  const m = obj(input, "manifest");
  const id = str(m.id, "manifest.id");
  const name = str(m.name, "manifest.name");
  const version = str(m.version, "manifest.version");
  if (!SEMVER.test(version)) fail("manifest.version must be semver");

  const hosts = arr(m.allowedHosts, "manifest.allowedHosts");
  if (hosts.length === 0) fail("manifest.allowedHosts must not be empty");
  const allowedHosts = hosts.map((h, i) => {
    const host = str(h, `manifest.allowedHosts[${i}]`);
    if (!HOST.test(host)) fail(`manifest.allowedHosts[${i}] must be a bare hostname (no scheme, port or path)`);
    return host;
  });

  const credentialFields = arr(m.credentialFields, "manifest.credentialFields").map((f, i) => {
    const o = obj(f, `manifest.credentialFields[${i}]`);
    if (typeof o.secret !== "boolean") fail(`manifest.credentialFields[${i}].secret must be a boolean`);
    return {
      key: str(o.key, `manifest.credentialFields[${i}].key`),
      label: str(o.label, `manifest.credentialFields[${i}].label`),
      secret: o.secret,
    };
  });

  const seen = new Set<string>();
  const institutions = arr(m.institutions, "manifest.institutions").map((x, i) => {
    const o = obj(x, `manifest.institutions[${i}]`);
    const instId = str(o.id, `manifest.institutions[${i}].id`);
    if (seen.has(instId)) fail(`manifest.institutions has duplicate id "${instId}"`);
    seen.add(instId);
    return { id: instId, name: str(o.name, `manifest.institutions[${i}].name`) };
  });

  return { id, name, version, allowedHosts, credentialFields, institutions };
}

export function validateAbsenceReport(input: unknown): AbsenceReport {
  const r = obj(input, "report");
  const subjects = arr(r.subjects, "report.subjects").map((s, i) => {
    const o = obj(s, `report.subjects[${i}]`);
    return {
      name: str(o.name, `report.subjects[${i}].name`),
      hours: hours(o.hours, `report.subjects[${i}].hours`),
    };
  });
  const totalHours = hours(r.totalHours, "report.totalHours");
  const sum = subjects.reduce((a, s) => a + s.hours, 0);
  if (Math.abs(totalHours - sum) > HOURS_TOLERANCE) {
    fail(`report.totalHours (${totalHours}) must equal the sum of subject hours (${sum})`);
  }
  const syncedAt = str(r.syncedAt, "report.syncedAt");
  if (!ISO_DATE.test(syncedAt) || Number.isNaN(Date.parse(syncedAt))) {
    fail("report.syncedAt must be an ISO date");
  }
  return { totalHours, subjects, syncedAt };
}
