import { describe, expect, it } from "vitest";
import {
  ceilToInteger,
  floorToInteger,
  formatPercentage,
  getOrdinalSuffix,
  msToSeconds,
  roundProgressPercentage,
  roundToHundredth,
  roundToTenth,
} from "./math.utils";

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

describe("roundToHundredth", () => {
  it("rounds to two decimal places", () => {
    expect(roundToHundredth(1.456)).toBe(1.46);
  });

  it("returns integers unchanged", () => {
    expect(roundToHundredth(5)).toBe(5);
  });

  it("rounds down correctly", () => {
    expect(roundToHundredth(2.344)).toBe(2.34);
  });
});

describe("floorToInteger", () => {
  it("floors a positive decimal", () => {
    expect(floorToInteger(4.9)).toBe(4);
  });

  it("returns an integer unchanged", () => {
    expect(floorToInteger(3)).toBe(3);
  });

  it("floors a value just under a whole number", () => {
    expect(floorToInteger(2.9999)).toBe(2);
  });
});

describe("ceilToInteger", () => {
  it("ceils a positive decimal", () => {
    expect(ceilToInteger(4.1)).toBe(5);
  });

  it("returns an integer unchanged", () => {
    expect(ceilToInteger(3)).toBe(3);
  });

  it("ceils a value just over a whole number", () => {
    expect(ceilToInteger(2.0001)).toBe(3);
  });
});

describe("msToSeconds", () => {
  it("converts whole seconds", () => {
    expect(msToSeconds(3000)).toBe(3);
  });

  it("rounds up partial seconds", () => {
    expect(msToSeconds(3001)).toBe(4);
  });

  it("returns 1 for any positive ms under 1000", () => {
    expect(msToSeconds(500)).toBe(1);
  });
});

describe("roundProgressPercentage", () => {
  it("returns 50 when current is half the goal", () => {
    expect(roundProgressPercentage(25, 50)).toBe(50);
  });

  it("returns 100 when current equals goal", () => {
    expect(roundProgressPercentage(50, 50)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(roundProgressPercentage(1, 3)).toBe(33);
  });
});

describe("formatPercentage", () => {
  it("formats to 2 decimal places", () => {
    expect(formatPercentage(74.9999)).toBe("75.00");
  });

  it("pads trailing zeros", () => {
    expect(formatPercentage(75)).toBe("75.00");
  });

  it("formats a clean decimal", () => {
    expect(formatPercentage(12.5)).toBe("12.50");
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
