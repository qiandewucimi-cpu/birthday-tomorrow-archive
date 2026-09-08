import { execFileSync } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const candidates = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const tracked = new Set(execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean));
const forbiddenTracked = [
  /(^|\/)\.env($|\.)/,
  /\.(?:pem|key|p12|pfx|crt)$/i,
  /(^|\/)dist\//,
  /(^|\/)src\/generated\//,
  /(^|\/)customer-media\//,
  /(^|\/)\.private-instances\//,
  /(^|\/)private-projects\//,
];
const textChecks = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
  [/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/, "GitHub token"],
  [/\bsk-[A-Za-z0-9_-]{20,}\b/, "API key"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\b1[3-9]\d{9}\b/, "mainland China mobile number"],
  [/[A-Za-z]:\\Users\\[^\\\s]+\\/, "absolute Windows user path"],
];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".jsonc", ".md", ".mjs", ".ts", ".tsx", ".txt", ".yaml", ".yml"]);
const mediaExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const violations = [];

function inspectText(buffer, label) {
  const text = buffer.toString("utf8");
  for (const [pattern, kind] of textChecks) {
    if (pattern.test(text)) violations.push(`${label}: possible ${kind}`);
  }
}

function inspectMedia(buffer, label) {
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
  const isWebp = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (!isPng && !isJpeg && !isWebp) {
    violations.push(`${label}: extension does not match a supported PNG, JPEG, or WebP image`);
    return;
  }
  if (isPng) {
    let offset = 8;
    while (offset + 12 <= buffer.length) {
      const length = buffer.readUInt32BE(offset);
      const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
      if (["eXIf", "iTXt", "tEXt", "zTXt"].includes(type)) violations.push(`${label}: PNG metadata chunk ${type} is not allowed`);
      offset += 12 + length;
      if (type === "IEND") break;
    }
  }
  if (isJpeg) {
    for (let offset = 2; offset + 4 < buffer.length && buffer[offset] === 0xff;) {
      const marker = buffer[offset + 1];
      if (marker === 0xda || marker === 0xd9) break;
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > buffer.length) break;
      if ([0xe1, 0xeb].includes(marker)) violations.push(`${label}: JPEG APP${marker - 0xe0} metadata is not allowed`);
      offset += 2 + length;
    }
  }
  if (isWebp) {
    let offset = 12;
    while (offset + 8 <= buffer.length) {
      const type = buffer.subarray(offset, offset + 4).toString("ascii");
      const length = buffer.readUInt32LE(offset + 4);
      if (["EXIF", "XMP ", "META"].includes(type)) violations.push(`${label}: WebP metadata chunk ${type.trim()} is not allowed`);
      offset += 8 + length + (length % 2);
    }
  }
  const ascii = buffer.toString("latin1");
  if (/(?:c2pa|jumbf|gpslatitude|gpslongitude|photoshop)/i.test(ascii)) violations.push(`${label}: embedded provenance or location metadata is not allowed`);
}

async function inspectWorkingFile(file) {
  if (tracked.has(file) && forbiddenTracked.some((pattern) => pattern.test(file))) violations.push(`${file}: forbidden private or generated path is tracked`);
  const absolute = path.join(root, file);
  let info;
  try {
    info = await lstat(absolute);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return;
    throw error;
  }
  if (info.isSymbolicLink()) {
    violations.push(`${file}: symbolic links are not allowed`);
    return;
  }
  const extension = path.extname(file).toLowerCase();
  if (!textExtensions.has(extension) && !mediaExtensions.has(extension)) return;
  const buffer = await readFile(absolute);
  if (textExtensions.has(extension)) inspectText(buffer, file);
  if (mediaExtensions.has(extension)) inspectMedia(buffer, file);
}

for (const file of candidates) await inspectWorkingFile(file);

const historyObjects = execFileSync("git", ["rev-list", "--objects", "--all"], { cwd: root, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const separator = line.indexOf(" ");
    return { sha: separator === -1 ? line : line.slice(0, separator), file: separator === -1 ? "" : line.slice(separator + 1) };
  });
const seen = new Set();
for (const { sha, file } of historyObjects) {
  if (!file || seen.has(sha)) continue;
  seen.add(sha);
  const extension = path.extname(file).toLowerCase();
  if (!textExtensions.has(extension) && !mediaExtensions.has(extension)) continue;
  const type = execFileSync("git", ["cat-file", "-t", sha], { cwd: root, encoding: "utf8" }).trim();
  if (type !== "blob") continue;
  const size = Number(execFileSync("git", ["cat-file", "-s", sha], { cwd: root, encoding: "utf8" }).trim());
  if (size > 8 * 1024 * 1024) {
    violations.push(`history:${file}@${sha.slice(0, 10)}: blob exceeds the 8 MB privacy inspection limit`);
    continue;
  }
  const buffer = execFileSync("git", ["cat-file", "blob", sha], { cwd: root, encoding: "buffer", maxBuffer: 10 * 1024 * 1024 });
  if (textExtensions.has(extension)) inspectText(buffer, `history:${file}@${sha.slice(0, 10)}`);
  if (mediaExtensions.has(extension)) inspectMedia(buffer, `history:${file}@${sha.slice(0, 10)}`);
}

if (violations.length) {
  console.error(`Privacy check failed:\n- ${violations.join("\n- ")}`);
  process.exit(1);
}

console.log(`Privacy check passed (${candidates.length} working files and ${seen.size} historical blobs inspected)`);
