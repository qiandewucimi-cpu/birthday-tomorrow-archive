import { lstat, mkdir, readFile, readdir, realpath, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertValidInstance } from "./instance-schema.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const selectedId = process.env.MEMORY_INSTANCE || "demo-afterglow";
const externalFile = process.env.MEMORY_INSTANCE_FILE;
const externalAssets = process.env.MEMORY_INSTANCE_ASSETS;
const productMode = process.env.MEMORY_PRODUCT_MODE || (externalFile ? "recipient" : "demo");

if (!["demo", "recipient", "studio"].includes(productMode)) throw new Error("MEMORY_PRODUCT_MODE must be demo, recipient, or studio");
if (externalFile && productMode !== "recipient") throw new Error("External private instances may only be built in recipient mode");

if (!/^[a-z0-9][a-z0-9-]{2,63}$/.test(selectedId)) throw new Error("MEMORY_INSTANCE contains unsupported characters");

const instanceFile = externalFile
  ? path.resolve(externalFile)
  : path.join(projectRoot, "instances", selectedId, "project.json");
const insideProject = (candidate) => {
  const relative = path.relative(projectRoot, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
};
if (externalFile && insideProject(instanceFile)) throw new Error("MEMORY_INSTANCE_FILE must point outside the repository");
const raw = await readFile(instanceFile, "utf8");
const instance = JSON.parse(raw);
assertValidInstance(instance, instanceFile);
if (!externalFile && instance.id !== selectedId) throw new Error(`Instance id ${instance.id} does not match selected folder ${selectedId}`);

const images = [instance.socialImage, instance.opening.image, ...instance.chapters.map((chapter) => chapter.image), instance.finale.image].filter(Boolean);
let publicDir = false;
if (externalFile) {
  if (images.length > 0 && !externalAssets) throw new Error("MEMORY_INSTANCE_ASSETS is required when an external instance references images");
  if (images.length === 0 && externalAssets) throw new Error("MEMORY_INSTANCE_ASSETS must be omitted when the instance references no images");
  if (externalAssets) {
    const resolvedAssets = path.resolve(externalAssets);
    if (insideProject(resolvedAssets)) throw new Error("MEMORY_INSTANCE_ASSETS must point outside the repository");
    const assetRoot = await lstat(resolvedAssets);
    if (assetRoot.isSymbolicLink() || !assetRoot.isDirectory()) throw new Error("MEMORY_INSTANCE_ASSETS must be a real directory, not a symbolic link");
    publicDir = resolvedAssets;
  }
} else {
  const builtInAssets = path.join(path.dirname(instanceFile), "public");
  try {
    if ((await stat(builtInAssets)).isDirectory()) publicDir = builtInAssets;
  } catch {
    publicDir = false;
  }
}

if (images.length > 0 && !publicDir) throw new Error(`Instance ${instance.id} references images but has no isolated asset directory`);

const declaredFiles = new Set(images.map((image) => image.slice(1)));
const actualFiles = new Set();
if (publicDir) {
  const realAssetRoot = await realpath(publicDir);
  const walk = async (directory, relativeDirectory = "") => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.posix.join(relativeDirectory.split(path.sep).join("/"), entry.name);
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) throw new Error(`Symbolic links are not allowed in instance assets: ${relative}`);
      if (info.isDirectory()) {
        await walk(absolute, relative);
        continue;
      }
      if (!info.isFile()) throw new Error(`Unsupported filesystem entry in instance assets: ${relative}`);
      const resolved = await realpath(absolute);
      const relation = path.relative(realAssetRoot, resolved);
      if (relation.startsWith(`..${path.sep}`) || relation === ".." || path.isAbsolute(relation)) throw new Error(`Asset resolves outside its isolated directory: ${relative}`);
      actualFiles.add(relative);
    }
  };
  await walk(publicDir);
}

for (const declared of declaredFiles) {
  if (!actualFiles.has(declared)) throw new Error(`Declared instance asset is missing: /${declared}`);
}
for (const actual of actualFiles) {
  if (!declaredFiles.has(actual)) throw new Error(`Undeclared file found in isolated instance assets: /${actual}`);
}

const generatedDir = path.join(projectRoot, "src", "generated");
const generatedFile = path.join(generatedDir, "current-instance.ts");
const serialized = JSON.stringify(instance, null, 2).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
const source = `import type { ProductInstance } from "../product/types";\n\nconst instance = ${serialized} satisfies ProductInstance;\n\nexport default instance;\n`;
await mkdir(generatedDir, { recursive: true });
await writeFile(generatedFile, source, "utf8");
await writeFile(path.join(generatedDir, "build-context.json"), `${JSON.stringify({ instanceId: instance.id, productMode, publicDir }, null, 2)}\n`, "utf8");
console.log(`Prepared instance ${instance.id} (${instance.chapters.length} chapters, mode: ${productMode}, isolated assets: ${declaredFiles.size})`);
