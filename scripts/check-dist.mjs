import { lstat, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const selectedId = process.argv[2] || process.env.MEMORY_INSTANCE || "demo-afterglow";
const externalFile = process.env.MEMORY_INSTANCE_FILE;
const instancesRoot = path.join(root, "instances");
const distRoot = path.join(root, "dist");
const context = JSON.parse(await readFile(path.join(root, "src", "generated", "build-context.json"), "utf8"));

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    const info = await lstat(full);
    if (info.isSymbolicLink()) throw new Error(`Symbolic link found in dist: ${path.relative(distRoot, full)}`);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
    else throw new Error(`Unsupported filesystem entry in dist: ${path.relative(distRoot, full)}`);
  }
  return files;
}

if (!(await stat(distRoot)).isDirectory()) throw new Error("dist does not exist; run the build first");
const instanceNames = (await readdir(instancesRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
const projectFile = externalFile ? path.resolve(externalFile) : path.join(instancesRoot, selectedId, "project.json");
if (!externalFile && !instanceNames.includes(selectedId)) throw new Error(`Unknown selected instance: ${selectedId}`);
const selected = JSON.parse(await readFile(projectFile, "utf8"));
if (context.instanceId !== selected.id) throw new Error(`Build context mismatch: ${context.instanceId} != ${selected.id}`);

const files = await walk(distRoot);
const relativeFiles = files.map((file) => path.relative(distRoot, file).split(path.sep).join("/"));
const textBundle = (await Promise.all(files.filter((file) => /\.(?:html|js|css|json)$/i.test(file)).map((file) => readFile(file, "utf8")))).join("\n");
const declaredAssets = new Set([selected.socialImage, selected.opening.image, ...selected.chapters.map((chapter) => chapter.image), selected.finale.image].filter(Boolean).map((image) => image.slice(1)));
const emittedAssets = new Set(relativeFiles.filter((file) => /\.(?:avif|gif|jpe?g|png|webp)$/i.test(file)));

for (const image of declaredAssets) {
  if (!emittedAssets.has(image)) throw new Error(`Selected asset missing from dist: /${image}`);
}
for (const image of emittedAssets) {
  if (!declaredAssets.has(image)) throw new Error(`Undeclared media leaked into dist: /${image}`);
}

for (const otherId of instanceNames.filter((id) => id !== selected.id)) {
  const other = JSON.parse(await readFile(path.join(instancesRoot, otherId, "project.json"), "utf8"));
  if (relativeFiles.some((file) => file.startsWith(`${otherId}/`))) throw new Error(`Foreign asset directory leaked into dist: ${otherId}`);
  for (const marker of [other.id, other.title, other.sender.displayName, other.recipient.displayName]) {
    if (marker && textBundle.includes(marker)) throw new Error(`Foreign instance marker leaked into dist: ${marker}`);
  }
}

if (context.productMode === "recipient") {
  for (const marker of ["进入制作台", "内部制作台", "导入 JSON", "导出项目", "StudioApp"]) {
    if (textBundle.includes(marker) || relativeFiles.some((file) => file.includes(marker))) throw new Error(`Studio capability leaked into recipient build: ${marker}`);
  }
}

console.log(`Distribution isolation passed for ${selected.id} (${relativeFiles.length} files, ${emittedAssets.size} declared media assets)`);
