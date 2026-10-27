import { readFileSync } from "node:fs";
import { sha256Hex, validateManifest } from "../src/index";
import type { RegistryEntry } from "../src/index";

const [bundlePath, manifestPath, bundleUrl] = process.argv.slice(2);
if (!bundlePath || !manifestPath || !bundleUrl) {
  console.error("usage: bun scripts/registry-entry.ts <bundle-file> <manifest-json> <bundle-url>");
  process.exit(1);
}

const manifest = validateManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
const entry: RegistryEntry = {
  id: manifest.id,
  name: manifest.name,
  version: manifest.version,
  bundleUrl,
  sha256: await sha256Hex(new Uint8Array(readFileSync(bundlePath))),
  institutionCount: manifest.institutions.length,
};
console.log(JSON.stringify(entry, null, 2));
