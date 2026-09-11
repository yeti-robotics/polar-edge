export const COPR_FALLBACK_METADATA_KEY = "coprFallbackEnabled";

export function getOrganizationMetadata(metadata: unknown): Record<string, unknown> {
  if (!metadata) return {};

  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

export function isCoprFallbackEnabled(metadata: unknown): boolean {
  return getOrganizationMetadata(metadata)[COPR_FALLBACK_METADATA_KEY] === true;
}
