import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "regentry-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const SCRIPT = join(import.meta.dir, "../scripts/registry-entry.ts");
const URL_ = "https://example.com/b.js";

function bundle(manifest: unknown): string {
  return `(function(){globalThis.FaltasmasConnector={connector:{manifest:${JSON.stringify(manifest)},fetchAbsences:async()=>{}}};})();`;
}
function write(name: string, text: string): string {
  const p = join(dir, name);
  writeFileSync(p, text);
  return p;
}
async function run(...args: string[]) {
  const proc = Bun.spawn([process.execPath, SCRIPT, ...args], { stdout: "pipe", stderr: "pipe" });
  const [out, err, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { out, err, code };
}

const good = {
  id: "demo",
  name: "Demo",
  version: "1.0.0",
  allowedHosts: ["example.com"],
  credentialFields: [{ key: "u", label: "U", secret: false }],
  institutions: [{ id: "a", name: "A" }],
};

describe("registry-entry script", () => {
  test("prints the registry entry for a valid bundle", async () => {
    const text = bundle(good);
    const p = write("ok.js", text);
    const r = await run(p, URL_);
    expect(r.code).toBe(0);
    const entry = JSON.parse(r.out);
    const hash = new Bun.CryptoHasher("sha256").update(text).digest("hex");
    expect(entry).toEqual({
      id: "demo", name: "Demo", version: "1.0.0", bundleUrl: URL_, sha256: hash, institutionCount: 1,
    });
  });
  test("fails on a bundle without the global", async () => {
    const r = await run(write("noglobal.js", "(function(){})();"), URL_);
    expect(r.code).toBe(1);
    expect(r.err.trim()).toMatch(/^error: .*FaltasmasConnector/);
    expect(r.err.trim().split("\n")).toHaveLength(1);
  });
  test("fails on an invalid manifest", async () => {
    const r = await run(write("bad.js", bundle({ ...good, version: "x" })), URL_);
    expect(r.code).toBe(1);
    expect(r.err.trim()).toMatch(/^error: /);
    expect(r.err.trim().split("\n")).toHaveLength(1);
  });
  test("fails on a missing file", async () => {
    const r = await run(join(dir, "nope.js"), URL_);
    expect(r.code).toBe(1);
    expect(r.err.trim()).toMatch(/^error: /);
    expect(r.err.trim().split("\n")).toHaveLength(1);
  });
});
