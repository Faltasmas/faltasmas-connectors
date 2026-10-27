import { readFileSync } from "node:fs";
import { BUNDLE_GLOBAL, sha256Hex, validateManifest } from "../src/index";
import type { RegistryEntry } from "../src/index";

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

const [bundlePath, bundleUrl] = process.argv.slice(2);
if (!bundlePath || !bundleUrl) die("usage: registry-entry.ts <bundle-file> <bundle-url>");

try {
  const bytes = new Uint8Array(readFileSync(bundlePath));
  const text = new TextDecoder().decode(bytes);
  const g = globalThis as Record<string, unknown>;
  delete g[BUNDLE_GLOBAL];
  // Evaluate the IIFE with no `require`; it assigns globalThis[BUNDLE_GLOBAL].
  new Function("require", text)(undefined);
  const ns = g[BUNDLE_GLOBAL] as { connector?: { manifest?: unknown } } | undefined;
  if (!ns?.connector?.manifest) die(`bundle does not define globalThis.${BUNDLE_GLOBAL}.connector.manifest`);
  const manifest = validateManifest(ns.connector.manifest);
  const entry: RegistryEntry = {
    id: manifest.id,
    name: manifest.name,
    version: manifest.version,
    bundleUrl,
    sha256: await sha256Hex(bytes),
    institutionCount: manifest.institutions.length,
  };
  console.log(JSON.stringify(entry, null, 2));
} catch (e) {
  die((e instanceof Error ? e.message : String(e)).split("\n")[0]!);
}
