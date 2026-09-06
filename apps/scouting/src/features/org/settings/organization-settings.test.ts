import { describe, expect, it } from "vitest";
import { getOrganizationMetadata, isCoprFallbackEnabled } from "./organization-settings";

describe("organization COPR fallback metadata", () => {
  it("defaults to disabled for absent or malformed metadata", () => {
    expect(isCoprFallbackEnabled(null)).toBe(false);
    expect(isCoprFallbackEnabled("not-json")).toBe(false);
  });

  it("reads object and serialized metadata", () => {
    expect(isCoprFallbackEnabled({ coprFallbackEnabled: true })).toBe(true);
    expect(isCoprFallbackEnabled('{"coprFallbackEnabled":true}')).toBe(true);
  });

  it("returns a safe object while preserving existing keys", () => {
    expect(getOrganizationMetadata('{"existingSetting":"preserved"}')).toEqual({
      existingSetting: "preserved",
    });
  });
});
