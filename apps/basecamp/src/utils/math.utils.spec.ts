import { describe, expect, it } from "vitest";
import { getOrdinalSuffix, roundToTenth } from "./math.utils";

describe("roundToTenth", () => {
  it("rounds to one decimal place", () => {
    expect(roundToTenth(1.05)).toBe(1.1);
  });

  it("returns integer values unchanged", () => {
    expect(roundToTenth(1.0)).toBe(1);
  });

  it("rounds down correctly", () => {
    expect(roundToTenth(2.34)).toBe(2.3);
  });
});

describe("getOrdinalSuffix", () => {
  it("returns 1st for 1", () => {
    expect(getOrdinalSuffix(1)).toBe("1st");
  });

  it("returns 2nd for 2", () => {
    expect(getOrdinalSuffix(2)).toBe("2nd");
  });

  it("returns 3rd for 3", () => {
    expect(getOrdinalSuffix(3)).toBe("3rd");
  });

  it("returns 4th for 4", () => {
    expect(getOrdinalSuffix(4)).toBe("4th");
  });

  it("returns 11th for 11 (teen exception)", () => {
    expect(getOrdinalSuffix(11)).toBe("11th");
  });

  it("returns 12th for 12 (teen exception)", () => {
    expect(getOrdinalSuffix(12)).toBe("12th");
  });

  it("returns 13th for 13 (teen exception)", () => {
    expect(getOrdinalSuffix(13)).toBe("13th");
  });

  it("returns 21st for 21", () => {
    expect(getOrdinalSuffix(21)).toBe("21st");
  });

  it("returns 22nd for 22", () => {
    expect(getOrdinalSuffix(22)).toBe("22nd");
  });

  it("returns 23rd for 23", () => {
    expect(getOrdinalSuffix(23)).toBe("23rd");
  });

  it("returns 24th for 24", () => {
    expect(getOrdinalSuffix(24)).toBe("24th");
  });

  it("returns 101st for 101", () => {
    expect(getOrdinalSuffix(101)).toBe("101st");
  });

  it("returns 111th for 111 (teen exception at hundreds)", () => {
    expect(getOrdinalSuffix(111)).toBe("111th");
  });

  it("returns 112th for 112 (teen exception at hundreds)", () => {
    expect(getOrdinalSuffix(112)).toBe("112th");
  });
});
