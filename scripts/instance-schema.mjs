const idPattern = /^[a-z0-9][a-z0-9-]{2,63}$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredString(value, path, issues, maxLength = 5000) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${path} must be a non-empty string`);
    return;
  }
  if (value.length > maxLength) issues.push(`${path} exceeds ${maxLength} characters`);
}

function allowOnly(value, allowed, path, issues) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) issues.push(`${path}.${key} is not an allowed field`);
  }
}

function optionalLocalImage(value, path, issues) {
  if (value === undefined) return;
  if (typeof value !== "string" || !/^\/[a-zA-Z0-9/_\-.]+\.(?:avif|jpe?g|png|webp)$/i.test(value) || value.includes("..")) {
    issues.push(`${path} must be a root-relative local image path`);
  }
}

export function validateInstance(value, label = "instance") {
  const issues = [];
  if (!isRecord(value)) return [`${label} must contain a JSON object`];
  allowOnly(value, ["id", "version", "title", "description", "socialImage", "recipient", "sender", "occasionLabel", "storageNamespace", "access", "opening", "chapters", "finale"], label, issues);

  requiredString(value.id, `${label}.id`, issues, 64);
  if (typeof value.id === "string" && !idPattern.test(value.id)) issues.push(`${label}.id must use lowercase letters, numbers, and hyphens`);
  if (!Number.isInteger(value.version) || value.version < 1) issues.push(`${label}.version must be a positive integer`);
  requiredString(value.title, `${label}.title`, issues, 120);
  requiredString(value.description, `${label}.description`, issues, 300);
  optionalLocalImage(value.socialImage, `${label}.socialImage`, issues);
  requiredString(value.occasionLabel, `${label}.occasionLabel`, issues, 80);
  requiredString(value.storageNamespace, `${label}.storageNamespace`, issues, 80);
  if (typeof value.storageNamespace === "string" && !idPattern.test(value.storageNamespace)) issues.push(`${label}.storageNamespace must use lowercase letters, numbers, and hyphens`);

  for (const personKey of ["recipient", "sender"]) {
    if (!isRecord(value[personKey])) issues.push(`${label}.${personKey} must be an object`);
    else {
      allowOnly(value[personKey], ["displayName"], `${label}.${personKey}`, issues);
      requiredString(value[personKey].displayName, `${label}.${personKey}.displayName`, issues, 40);
    }
  }

  if (!isRecord(value.access)) issues.push(`${label}.access must be an object`);
  else {
    allowOnly(value.access, ["passphrase", "prompt", "placeholder"], `${label}.access`, issues);
    requiredString(value.access.passphrase, `${label}.access.passphrase`, issues, 100);
    requiredString(value.access.prompt, `${label}.access.prompt`, issues, 160);
    requiredString(value.access.placeholder, `${label}.access.placeholder`, issues, 160);
  }

  if (!isRecord(value.opening)) issues.push(`${label}.opening must be an object`);
  else {
    allowOnly(value.opening, ["eyebrow", "titleLines", "invitation", "image"], `${label}.opening`, issues);
    requiredString(value.opening.eyebrow, `${label}.opening.eyebrow`, issues, 120);
    if (!Array.isArray(value.opening.titleLines) || value.opening.titleLines.length !== 2) issues.push(`${label}.opening.titleLines must contain exactly two strings`);
    else value.opening.titleLines.forEach((line, index) => requiredString(line, `${label}.opening.titleLines[${index}]`, issues, 80));
    requiredString(value.opening.invitation, `${label}.opening.invitation`, issues, 300);
    optionalLocalImage(value.opening.image, `${label}.opening.image`, issues);
  }

  if (!Array.isArray(value.chapters) || value.chapters.length < 1 || value.chapters.length > 30) {
    issues.push(`${label}.chapters must contain between 1 and 30 chapters`);
  } else {
    value.chapters.forEach((chapter, index) => {
      const path = `${label}.chapters[${index}]`;
      if (!isRecord(chapter)) {
        issues.push(`${path} must be an object`);
        return;
      }
      allowOnly(chapter, ["number", "eyebrow", "title", "body", "accent", "image"], path, issues);
      if (chapter.number !== index + 1) issues.push(`${path}.number must be ${index + 1}`);
      requiredString(chapter.eyebrow, `${path}.eyebrow`, issues, 80);
      requiredString(chapter.title, `${path}.title`, issues, 120);
      requiredString(chapter.body, `${path}.body`, issues, 5000);
      requiredString(chapter.accent, `${path}.accent`, issues, 40);
      optionalLocalImage(chapter.image, `${path}.image`, issues);
    });
  }

  if (!isRecord(value.finale)) issues.push(`${label}.finale must be an object`);
  else {
    allowOnly(value.finale, ["eyebrow", "heading", "body", "image"], `${label}.finale`, issues);
    requiredString(value.finale.eyebrow, `${label}.finale.eyebrow`, issues, 120);
    requiredString(value.finale.heading, `${label}.finale.heading`, issues, 200);
    requiredString(value.finale.body, `${label}.finale.body`, issues, 600);
    optionalLocalImage(value.finale.image, `${label}.finale.image`, issues);
  }

  return issues;
}

export function assertValidInstance(value, label) {
  const issues = validateInstance(value, label);
  if (issues.length > 0) throw new Error(`Invalid memory instance:\n- ${issues.join("\n- ")}`);
  return value;
}
