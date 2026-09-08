import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertValidInstance } from "./instance-schema.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const instancesRoot = path.resolve(scriptDir, "..", "instances");
const entries = await readdir(instancesRoot, { withFileTypes: true });
let checked = 0;

for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  const file = path.join(instancesRoot, entry.name, "project.json");
  const instance = JSON.parse(await readFile(file, "utf8"));
  assertValidInstance(instance, file);
  if (instance.id !== entry.name) throw new Error(`Instance id ${instance.id} does not match folder ${entry.name}`);
  checked += 1;
  console.log(`Valid: ${instance.id} (${instance.chapters.length} chapters)`);
}

if (checked === 0) throw new Error("No built-in instances found");
console.log(`Validated ${checked} built-in instances`);
