import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateInstance } from "./instance-schema.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readInstance(id) {
  return JSON.parse(await readFile(path.join(projectRoot, "instances", id, "project.json"), "utf8"));
}

test("all fictional instances satisfy the product contract", async () => {
  for (const id of ["demo-afterglow", "demo-starlight", "demo-lantern"]) {
    assert.deepEqual(validateInstance(await readInstance(id), id), []);
  }
});

test("remote and traversing image paths are rejected", async () => {
  const instance = await readInstance("demo-afterglow");
  instance.opening.image = "https://example.com/private.jpg";
  instance.chapters[0].image = "/../private.jpg";
  instance.socialImage = "/demo-afterglow/private.pdf";
  const issues = validateInstance(instance, "broken");
  assert.ok(issues.filter((issue) => issue.includes("local image path")).length === 3);
});

test("unknown fields are rejected before they can enter a bundle", async () => {
  const instance = await readInstance("demo-afterglow");
  instance.internalNotes = "must never ship";
  instance.chapters[0].sourcePath = "C:/private/source.jpg";
  const issues = validateInstance(instance, "broken");
  assert.ok(issues.some((issue) => issue.includes("internalNotes is not an allowed field")));
  assert.ok(issues.some((issue) => issue.includes("sourcePath is not an allowed field")));
});

test("a chapter-number gap is rejected", async () => {
  const instance = await readInstance("demo-starlight");
  instance.chapters[2].number = 8;
  assert.ok(validateInstance(instance, "broken").some((issue) => issue.includes("number must be 3")));
});

test("unsafe instance ids are rejected", async () => {
  const instance = await readInstance("demo-lantern");
  instance.id = "../private";
  instance.storageNamespace = "../private";
  const issues = validateInstance(instance, "broken");
  assert.ok(issues.some((issue) => issue.includes("id must use lowercase letters")));
  assert.ok(issues.some((issue) => issue.includes("storageNamespace must use lowercase letters")));
});
