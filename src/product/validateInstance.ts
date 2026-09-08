import type { ProductInstance } from "./types";

const idPattern = /^[a-z0-9][a-z0-9-]{2,63}$/;
const localImagePattern = /^\/[a-zA-Z0-9/_\-.]+\.(?:avif|jpe?g|png|webp)$/i;
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(record: UnknownRecord, key: string, label: string, issues: string[], maxLength: number) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`请填写${label}`);
    return;
  }
  if (value.length > maxLength) issues.push(`${label}不能超过 ${maxLength} 个字符`);
}

function allowOnly(record: UnknownRecord, allowed: readonly string[], label: string, issues: string[]) {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) issues.push(`${label}包含未支持的字段：${key}`);
  }
}

function validateLocalImage(value: unknown, label: string, issues: string[]) {
  if (value === undefined) return;
  if (typeof value !== "string" || !localImagePattern.test(value) || value.includes("..")) {
    issues.push(`${label}必须使用站内绝对路径，例如 /story/cover.webp`);
  }
}

export function validateProductInstance(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["项目文件必须是一个 JSON 对象"];
  allowOnly(value, ["id", "version", "title", "description", "socialImage", "recipient", "sender", "occasionLabel", "storageNamespace", "access", "opening", "chapters", "finale"], "项目文件", issues);

  requireString(value, "id", "项目 ID", issues, 64);
  if (typeof value.id === "string" && !idPattern.test(value.id)) issues.push("项目 ID 只能包含小写字母、数字和连字符");
  if (!Number.isInteger(value.version) || Number(value.version) < 1) issues.push("项目版本必须是正整数");
  requireString(value, "title", "作品标题", issues, 120);
  requireString(value, "description", "作品描述", issues, 300);
  validateLocalImage(value.socialImage, "分享封面", issues);
  requireString(value, "occasionLabel", "纪念场合", issues, 80);
  requireString(value, "storageNamespace", "存储命名空间", issues, 80);
  if (typeof value.storageNamespace === "string" && !idPattern.test(value.storageNamespace)) issues.push("存储命名空间只能包含小写字母、数字和连字符");

  for (const [key, label] of [["sender", "送件人称呼"], ["recipient", "收件人称呼"]] as const) {
    const person = value[key];
    if (!isRecord(person)) issues.push(`${label}格式不正确`);
    else {
      allowOnly(person, ["displayName"], label, issues);
      requireString(person, "displayName", label, issues, 40);
    }
  }

  if (!isRecord(value.access)) {
    issues.push("开启设置格式不正确");
  } else {
    allowOnly(value.access, ["passphrase", "prompt", "placeholder"], "开启设置", issues);
    requireString(value.access, "passphrase", "开启答案", issues, 100);
    requireString(value.access, "prompt", "开启提示", issues, 160);
    requireString(value.access, "placeholder", "开启输入提示", issues, 160);
  }

  if (!isRecord(value.opening)) {
    issues.push("封面设置格式不正确");
  } else {
    allowOnly(value.opening, ["eyebrow", "titleLines", "invitation", "image"], "封面设置", issues);
    requireString(value.opening, "eyebrow", "封面眉题", issues, 120);
    const lines = value.opening.titleLines;
    if (!Array.isArray(lines) || lines.length !== 2 || lines.some((line) => typeof line !== "string" || !line.trim())) {
      issues.push("请填写两行封面标题");
    } else if (lines.some((line) => line.length > 80)) {
      issues.push("每行封面标题不能超过 80 个字符");
    }
    requireString(value.opening, "invitation", "开场邀请", issues, 300);
    validateLocalImage(value.opening.image, "封面图片", issues);
  }

  if (!Array.isArray(value.chapters) || value.chapters.length < 1 || value.chapters.length > 30) {
    issues.push("章节数量必须在 1 到 30 之间");
  } else {
    value.chapters.forEach((chapter, index) => {
      if (!isRecord(chapter)) {
        issues.push(`第 ${index + 1} 章格式不正确`);
        return;
      }
      allowOnly(chapter, ["number", "eyebrow", "title", "body", "accent", "image"], `第 ${index + 1} 章`, issues);
      if (chapter.number !== index + 1) issues.push(`第 ${index + 1} 个章节编号不连续`);
      requireString(chapter, "eyebrow", `第 ${index + 1} 章眉题`, issues, 80);
      requireString(chapter, "title", `第 ${index + 1} 章标题`, issues, 120);
      requireString(chapter, "body", `第 ${index + 1} 章正文`, issues, 5000);
      requireString(chapter, "accent", `第 ${index + 1} 章情绪标签`, issues, 40);
      validateLocalImage(chapter.image, `第 ${index + 1} 章图片`, issues);
    });
  }

  if (!isRecord(value.finale)) {
    issues.push("终章设置格式不正确");
  } else {
    allowOnly(value.finale, ["eyebrow", "heading", "body", "image"], "终章设置", issues);
    requireString(value.finale, "eyebrow", "终章眉题", issues, 120);
    requireString(value.finale, "heading", "终章标题", issues, 200);
    requireString(value.finale, "body", "终章正文", issues, 600);
    validateLocalImage(value.finale.image, "终章图片", issues);
  }

  return issues;
}

export function isProductInstance(value: unknown): value is ProductInstance {
  return validateProductInstance(value).length === 0;
}

export function safeLocalImage(value?: string): string | undefined {
  return value && localImagePattern.test(value) && !value.includes("..") ? value : undefined;
}
