import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDir = path.join(root, "src", "generated");
const mode = process.argv[2];
if (!new Set(["build", "dev", "typecheck"]).has(mode)) throw new Error("Usage: node scripts/run-product.mjs <build|dev|typecheck>");

function run(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: root, env: process.env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(script)} failed${signal ? ` with signal ${signal}` : ` with exit code ${code}`}`));
    });
  });
}

try {
  await run(path.join(root, "scripts", "select-instance.mjs"));
  await run(path.join(root, "node_modules", "typescript", "bin", "tsc"), ["-b"]);
  if (mode === "dev") {
    await run(path.join(root, "node_modules", "vite", "bin", "vite.js"), ["--config", "vite.config.ts"]);
  }
  if (mode === "build") {
    await run(path.join(root, "node_modules", "vite", "bin", "vite.js"), ["build", "--config", "vite.config.ts"]);
    await run(path.join(root, "scripts", "check-dist.mjs"));
  }
} finally {
  await rm(generatedDir, { recursive: true, force: true });
}
