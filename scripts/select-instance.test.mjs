import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const selector = path.join(root, "scripts", "select-instance.mjs");
const generated = path.join(root, "src", "generated");

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "memory-space-instance-"));
  const instance = JSON.parse(await readFile(path.join(root, "instances", "demo-afterglow", "project.json"), "utf8"));
  instance.id = "external-demo";
  instance.storageNamespace = "external-demo";
  delete instance.socialImage;
  delete instance.opening.image;
  for (const chapter of instance.chapters) delete chapter.image;
  delete instance.finale.image;
  const projectFile = path.join(directory, "project.json");
  await writeFile(projectFile, JSON.stringify(instance), "utf8");
  return { directory, instance, projectFile };
}

function run(projectFile, assets) {
  return execFileSync(process.execPath, [selector], {
    cwd: root,
    env: { ...process.env, MEMORY_INSTANCE_FILE: projectFile, MEMORY_INSTANCE_ASSETS: assets, MEMORY_PRODUCT_MODE: "recipient" },
    encoding: "utf8",
    stdio: "pipe",
  });
}

test("external assets are rejected when the instance references no media", async () => {
  const item = await fixture();
  const assets = path.join(item.directory, "assets");
  await mkdir(assets);
  await rm(generated, { recursive: true, force: true });
  try {
    assert.throws(() => run(item.projectFile, assets), /must be omitted when the instance references no images/);
    await assert.rejects(() => readFile(path.join(generated, "current-instance.ts")), /ENOENT/);
  } finally {
    await rm(item.directory, { recursive: true, force: true });
  }
});

test("undeclared files cannot enter an isolated asset directory", async () => {
  const item = await fixture();
  const assets = path.join(item.directory, "assets");
  await mkdir(assets);
  item.instance.opening.image = "/asset.webp";
  await writeFile(item.projectFile, JSON.stringify(item.instance), "utf8");
  await writeFile(path.join(assets, "asset.webp"), "declared", "utf8");
  await writeFile(path.join(assets, "private-note.txt"), "must not ship", "utf8");
  await rm(generated, { recursive: true, force: true });
  try {
    assert.throws(() => run(item.projectFile, assets), /Undeclared file found/);
    await assert.rejects(() => readFile(path.join(generated, "current-instance.ts")), /ENOENT/);
  } finally {
    await rm(item.directory, { recursive: true, force: true });
  }
});

test("a valid external recipient instance is prepared only after asset validation", async () => {
  const item = await fixture();
  const assets = path.join(item.directory, "assets");
  await mkdir(assets);
  item.instance.opening.image = "/asset.webp";
  await writeFile(item.projectFile, JSON.stringify(item.instance), "utf8");
  await writeFile(path.join(assets, "asset.webp"), "declared", "utf8");
  await rm(generated, { recursive: true, force: true });
  try {
    assert.match(run(item.projectFile, assets), /mode: recipient/);
    const context = JSON.parse(await readFile(path.join(generated, "build-context.json"), "utf8"));
    assert.equal(context.instanceId, "external-demo");
    assert.equal(context.productMode, "recipient");
  } finally {
    await rm(generated, { recursive: true, force: true });
    await rm(item.directory, { recursive: true, force: true });
  }
});
