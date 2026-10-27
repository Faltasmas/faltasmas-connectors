import { describe, expect, test } from "bun:test";
import { ConnectorError, validateAbsenceReport, validateManifest } from "../src/index";

const manifest = () => ({
  id: "alexia",
  name: "Alexia",
  version: "1.0.0",
  allowedHosts: ["web2.alexiaedu.com"],
  credentialFields: [{ key: "user", label: "User", secret: false }],
  institutions: [{ id: "a", name: "A" }],
});
const report = () => ({
  totalHours: 5,
  subjects: [{ name: "Math", hours: 2 }, { name: "Art", hours: 3 }],
  syncedAt: "2026-10-27T10:00:00.000Z",
});

describe("validateManifest", () => {
  test("accepts a complete manifest", () => {
    expect(validateManifest(manifest())).toEqual(manifest());
  });
  test("rejects a manifest whose version is not semver", () => {
    expect(() => validateManifest({ ...manifest(), version: "1.0" })).toThrow("manifest.version must be semver");
    expect(() => validateManifest({ ...manifest(), version: "1.0.0" })).not.toThrow();
  });
  test("rejects a manifest with an empty allowedHosts", () => {
    expect(() => validateManifest({ ...manifest(), allowedHosts: [] })).toThrow("manifest.allowedHosts");
  });
  test("rejects a manifest with allowedHosts containing a scheme or path", () => {
    expect(() => validateManifest({ ...manifest(), allowedHosts: ["https://x.com/a"] })).toThrow("manifest.allowedHosts");
    expect(() => validateManifest({ ...manifest(), allowedHosts: ["web2.alexiaedu.com"] })).not.toThrow();
  });
  test("rejects an institution list with duplicate ids", () => {
    const m = { ...manifest(), institutions: [{ id: "a", name: "A" }, { id: "a", name: "B" }] };
    expect(() => validateManifest(m)).toThrow("manifest.institutions");
  });
});

describe("validateAbsenceReport", () => {
  test("accepts a report whose totalHours equals the sum of subject hours", () => {
    expect(validateAbsenceReport(report())).toEqual(report());
  });
  test("rejects a report whose totalHours differs from the sum by more than 0.01", () => {
    expect(() => validateAbsenceReport({ ...report(), totalHours: 5.02 })).toThrow("report.totalHours");
    expect(() => validateAbsenceReport({ ...report(), totalHours: 5.005 })).not.toThrow();
  });
  test("rejects negative or non-finite hours", () => {
    const neg = { ...report(), subjects: [{ name: "M", hours: -1 }], totalHours: -1 };
    expect(() => validateAbsenceReport(neg)).toThrow("hours");
    const inf = { ...report(), subjects: [{ name: "M", hours: Infinity }], totalHours: Infinity };
    expect(() => validateAbsenceReport(inf)).toThrow("hours");
    expect(() => validateAbsenceReport({ ...report(), totalHours: NaN })).toThrow("report.totalHours");
  });
  test("rejects a syncedAt that is not an ISO date", () => {
    expect(() => validateAbsenceReport({ ...report(), syncedAt: "yesterday" })).toThrow("report.syncedAt");
  });
});

test("ConnectorError keeps its code", () => {
  const e = new ConnectorError("session_expired", "x");
  expect(e).toBeInstanceOf(ConnectorError);
  expect(e).toBeInstanceOf(Error);
  expect(e.name).toBe("ConnectorError");
  expect(e.code).toBe("session_expired");
});
