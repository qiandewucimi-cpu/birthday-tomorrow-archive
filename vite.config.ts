import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const contextFile = fileURLToPath(new URL("./src/generated/build-context.json", import.meta.url));
const buildContext = existsSync(contextFile)
  ? JSON.parse(readFileSync(contextFile, "utf8")) as { productMode: "demo" | "recipient" | "studio"; publicDir: string | false }
  : { productMode: "recipient" as const, publicDir: false as const };
const base = process.env.MEMORY_BASE_PATH || "/";
if (!/^\/(?:[a-zA-Z0-9._~-]+\/)*$/.test(base)) throw new Error("MEMORY_BASE_PATH must be a root-relative path ending in /");
const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' ws: wss:; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

export default defineConfig({
  base,
  plugins: [react()],
  publicDir: buildContext.publicDir,
  define: {
    __PRODUCT_MODE__: JSON.stringify(buildContext.productMode),
  },
  server: {
    port: 4173,
    host: "127.0.0.1",
    headers: securityHeaders,
  },
  preview: {
    port: 4173,
    host: "127.0.0.1",
    headers: securityHeaders,
  },
});
