import { describe, expect, test } from "bun:test";
import { parseRegistry, searchRegistry, sha256Hex, verifyBundle } from "../src/index";

const HASH = "a".repeat(64);
const entry = (over: Record<string, unknown> = {}) => ({
  id: "alexia",
  name: "Alexia Classroom",
  version: "1.0.0",
  bundleUrl: "https://example.com/alexia.js",
  sha256: HASH,
  institutionCount: 3,
  ...over,
});
const enc = (s: string) => new TextEncoder().encode(s);

describe("registry", () => {
  test('sha256Hex of "abc" equals ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', async () => {
    expect(await sha256Hex(enc("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test('verifyBundle passes for a matching hash and throws "bundle hash mismatch" for a changed byte', async () => {
    const bytes = enc("abc");
    const hash = await sha256Hex(bytes);
    await verifyBundle(bytes, hash);
    const changed = enc("abd");
    await expect(verifyBundle(changed, hash)).rejects.toThrow("bundle hash mismatch");
  });

  test("parseRegistry rejects a duplicate connector id", () => {
    expect(() => parseRegistry({ connectors: [entry(), entry()] })).toThrow(/duplicate/);
  });

  test("parseRegistry rejects a sha256 that is not 64 hex characters", () => {
    expect(() => parseRegistry({ connectors: [entry({ sha256: "abc" })] })).toThrow(/sha256/);
    expect(() => parseRegistry({ connectors: [entry({ sha256: "g".repeat(64) })] })).toThrow(/sha256/);
  });

  test('searchRegistry finds "Alexia Classroom" for the queries "alexia", "ALEXIA" and "classroóm"', () => {
    const reg = parseRegistry({ connectors: [entry(), entry({ id: "other", name: "Other" })] });
    for (const q of ["alexia", "ALEXIA", "classroóm"]) {
      expect(searchRegistry(reg, q).map((e) => e.name)).toEqual(["Alexia Classroom"]);
    }
  });

  test("searchRegistry returns an empty list when nothing matches", () => {
    const reg = parseRegistry({ connectors: [entry()] });
    expect(searchRegistry(reg, "zzz")).toEqual([]);
  });

  test("searchRegistry returns all entries for an empty query", () => {
    const reg = parseRegistry({ connectors: [entry(), entry({ id: "b", name: "B" })] });
    expect(searchRegistry(reg, "")).toHaveLength(2);
  });
});
