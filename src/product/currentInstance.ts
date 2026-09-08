import selectedInstance from "../generated/current-instance";
import type { ProductInstance } from "./types";

export const currentInstance: ProductInstance = selectedInstance;
export const progressStorageKey = `${currentInstance.storageNamespace}:progress:v${currentInstance.version}`;
export const studioDraftStorageKey = `memory-space-studio:${currentInstance.id}:draft:v2`;

export function resolveInstanceAsset(assetPath?: string) {
  if (!assetPath) return undefined;
  return `${import.meta.env.BASE_URL}${assetPath.replace(/^\/+/, "")}`;
}

export function applyInstanceMetadata() {
  document.title = currentInstance.title;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = currentInstance.description;
  for (const [selector, content] of [
    ['meta[property="og:title"]', currentInstance.title],
    ['meta[property="og:description"]', currentInstance.description],
    ['meta[name="twitter:title"]', currentInstance.title],
    ['meta[name="twitter:description"]', currentInstance.description],
  ] as const) {
    const element = document.querySelector<HTMLMetaElement>(selector);
    if (element) element.content = content;
  }
  const socialImage = resolveInstanceAsset(currentInstance.socialImage ?? currentInstance.opening.image);
  if (socialImage) {
    const absolute = new URL(socialImage, window.location.href).href;
    const ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
    const twitterImage = document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]');
    if (ogImage) ogImage.content = absolute;
    if (twitterImage) twitterImage.content = absolute;
  }
}
