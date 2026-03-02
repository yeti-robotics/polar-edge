/**
 * Tests for schedule.util.ts
 *
 * Season structure (e.g. season 2025 = May 1 2025 – July 31 2026):
 *   - May–July (summer): regular Tue/Thu meetings, but OPTIONAL (excluded from totals)
 *   - Aug–Dec (off-season): Tue & Thu only, 3h each
 *   - Jan–Apr (competition): Tue/Thu/Fri 3h each, Sat 12h
 *   - May–July +1 (post-season): Tue/Thu, OPTIONAL
 *
 * No-meeting periods (season 2025):
 *   - Dec 19–31, 2025  (winter break)
 *   - Jan 1–6, 2026    (winter break)
 *   - Jul 1 & Jul 4, 2025 (but July is optional anyway)
 *   - Nov 28, 2025     (Black Friday — also not a regular off-season meeting day)
 *   - Apr 2–4, 2026    (Easter break — these WOULD be comp-season meetings)
 *
 * Partial meeting override:
 *   - Jan 24, 2026 (Saturday): 4h instead of 12h (ice storm)
 *
 * Day-of-week anchor: Jan 1, 2026 = Thursday (verified)
 * Day-of-week anchor: Jan 1, 2025 = Wednesday (verified)
 * Day-of-week anchor: Jan 1, 2024 = Monday    (verified, 2023 is not a leap year)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearScheduleCache,
  getTotalPossibleHoursToDate,
  getTotalSeasonHours,
} from "./schedule.util";

// ---------------------------------------------------------------------------
// Helper: hours added on a given date (compared to the day before)
// ---------------------------------------------------------------------------
function hoursAddedOn(dateStr: string): number {
  const date = new Date(dateStr);
  // Step back exactly one day in UTC time
  const prev = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  return getTotalPossibleHoursToDate(date) - getTotalPossibleHoursToDate(prev);
}

describe("schedule.util", () => {
  beforeEach(() => {
    clearScheduleCache();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearScheduleCache();
  });

  // -------------------------------------------------------------------------
  // Basic sanity
  // -------------------------------------------------------------------------
  describe("basic sanity", () => {
    it("returns 0 at the season start — May is optional", () => {
      expect(getTotalPossibleHoursToDate(new Date("2025-05-01T12:00:00Z"))).toBe(0);
    });

    it("returns 0 through the end of July — optional months", () => {
      expect(getTotalPossibleHoursToDate(new Date("2025-07-31T12:00:00Z"))).toBe(0);
    });

    it("returns a positive number after the first required meeting (Aug 5, 2025 = Tuesday)", () => {
      expect(getTotalPossibleHoursToDate(new Date("2025-08-05T12:00:00Z"))).toBeGreaterThan(0);
    });

    it("default parameter (no arg) does not throw and returns a number", () => {
      expect(() => getTotalPossibleHoursToDate()).not.toThrow();
      expect(typeof getTotalPossibleHoursToDate()).toBe("number");
    });

    it("total is monotonically non-decreasing", () => {
      const dates = [
        "2025-08-01T12:00:00Z",
        "2025-09-01T12:00:00Z",
        "2025-11-01T12:00:00Z",
        "2026-01-15T12:00:00Z",
        "2026-03-01T12:00:00Z",
      ];
      let prev = 0;
      for (const d of dates) {
        const curr = getTotalPossibleHoursToDate(new Date(d));
        expect(curr).toBeGreaterThanOrEqual(prev);
        prev = curr;
      }
    });
  });

  // -------------------------------------------------------------------------
  // Off-season meetings: Aug–Dec, Tuesday & Thursday only (3h each)
  // -------------------------------------------------------------------------
  describe("off-season meetings (Aug–Dec)", () => {
    // Aug 1 2025 = Friday  →  Aug 5 = Tuesday, Aug 7 = Thursday
    it("Tuesday (Aug 5) adds 3h", () => {
      // Aug 4 = Monday, Aug 5 = Tuesday
      expect(hoursAddedOn("2025-08-05T12:00:00Z")).toBe(3);
    });

    it("Thursday (Aug 7) adds 3h", () => {
      // Aug 6 = Wednesday, Aug 7 = Thursday
      expect(hoursAddedOn("2025-08-07T12:00:00Z")).toBe(3);
    });

    it("Wednesday (Aug 6) adds 0h — not a meeting day", () => {
      expect(hoursAddedOn("2025-08-06T12:00:00Z")).toBe(0);
    });

    it("Friday (Aug 8) adds 0h — off-season only has Tue/Thu", () => {
      expect(hoursAddedOn("2025-08-08T12:00:00Z")).toBe(0);
    });

    it("Saturday (Aug 9) adds 0h — off-season only has Tue/Thu", () => {
      expect(hoursAddedOn("2025-08-09T12:00:00Z")).toBe(0);
    });

    it("Thursday before winter break (Dec 18) adds 3h", () => {
      // Dec 17 = Wednesday, Dec 18 = Thursday
      expect(hoursAddedOn("2025-12-18T12:00:00Z")).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Winter break: Dec 19–31 and Jan 1–6 (no meetings)
  // -------------------------------------------------------------------------
  describe("winter break (Dec 19 – Jan 6)", () => {
    it("Dec 19 (Friday) adds 0h — also not a meeting day in off-season", () => {
      expect(hoursAddedOn("2025-12-19T12:00:00Z")).toBe(0);
    });

    it("Dec 23 (Tuesday) adds 0h — winter break overrides meeting day", () => {
      expect(hoursAddedOn("2025-12-23T12:00:00Z")).toBe(0);
    });

    it("Dec 25 (Thursday) adds 0h — winter break overrides meeting day", () => {
      expect(hoursAddedOn("2025-12-25T12:00:00Z")).toBe(0);
    });

    it("Jan 1, 2026 (Thursday) adds 0h — winter break", () => {
      expect(hoursAddedOn("2026-01-01T12:00:00Z")).toBe(0);
    });

    it("Jan 6, 2026 (Tuesday) adds 0h — last day of winter break", () => {
      expect(hoursAddedOn("2026-01-06T12:00:00Z")).toBe(0);
    });

    it("Jan 7, 2026 (Wednesday) adds 0h — first day after break, not a meeting day", () => {
      expect(hoursAddedOn("2026-01-07T12:00:00Z")).toBe(0);
    });

    it("Jan 8, 2026 (Thursday) adds 3h — first competition-season meeting", () => {
      expect(hoursAddedOn("2026-01-08T12:00:00Z")).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Competition season: Jan–Apr — Tue/Thu/Fri 3h, Sat 12h
  // -------------------------------------------------------------------------
  describe("competition season (Jan–Apr)", () => {
    // Jan 1 2026 = Thursday
    // Jan 8 = Thu, Jan 9 = Fri, Jan 10 = Sat, Jan 11 = Sun, Jan 12 = Mon, Jan 13 = Tue

    it("Thursday in January (Jan 8) adds 3h", () => {
      expect(hoursAddedOn("2026-01-08T12:00:00Z")).toBe(3);
    });

    it("Friday in January (Jan 9) adds 3h — competition-season extra meeting", () => {
      expect(hoursAddedOn("2026-01-09T12:00:00Z")).toBe(3);
    });

    it("Saturday in January (Jan 10) adds 12h — competition-season Saturday", () => {
      expect(hoursAddedOn("2026-01-10T12:00:00Z")).toBe(12);
    });

    it("Sunday in January (Jan 11) adds 0h", () => {
      expect(hoursAddedOn("2026-01-11T12:00:00Z")).toBe(0);
    });

    it("Monday in January (Jan 12) adds 0h", () => {
      expect(hoursAddedOn("2026-01-12T12:00:00Z")).toBe(0);
    });

    it("Tuesday in January (Jan 13) adds 3h", () => {
      expect(hoursAddedOn("2026-01-13T12:00:00Z")).toBe(3);
    });

    it("Jan 17, 2026 (Saturday) adds 12h — regular comp-season Saturday", () => {
      // Jan 16 = Friday, Jan 17 = Saturday
      expect(hoursAddedOn("2026-01-17T12:00:00Z")).toBe(12);
    });

    it("Jan 23, 2026 (Friday) adds 3h", () => {
      expect(hoursAddedOn("2026-01-23T12:00:00Z")).toBe(3);
    });

    it("Jan 24, 2026 (Saturday, ice storm) adds 4h — partial meeting override, not 12h", () => {
      expect(hoursAddedOn("2026-01-24T12:00:00Z")).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // Easter break: Apr 2–4, 2026 (would be Th/Fr/Sat competition meetings)
  // -------------------------------------------------------------------------
  describe("Easter break (Apr 2–4, 2026)", () => {
    // Apr 1 = Wednesday, Apr 2 = Thursday, Apr 3 = Friday, Apr 4 = Saturday

    it("Apr 2 (Thursday) adds 0h — Easter break overrides competition meeting", () => {
      expect(hoursAddedOn("2026-04-02T12:00:00Z")).toBe(0);
    });

    it("Apr 3 (Friday) adds 0h — Easter break", () => {
      expect(hoursAddedOn("2026-04-03T12:00:00Z")).toBe(0);
    });

    it("Apr 4 (Saturday) adds 0h — Easter break (would have been 12h)", () => {
      expect(hoursAddedOn("2026-04-04T12:00:00Z")).toBe(0);
    });

    it("Apr 7 (Tuesday) adds 3h — first meeting after Easter break", () => {
      // Apr 6 = Monday, Apr 7 = Tuesday
      expect(hoursAddedOn("2026-04-07T12:00:00Z")).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // Optional meetings: May–July are excluded from required totals
  // -------------------------------------------------------------------------
  describe("optional meetings (May–July) excluded from totals", () => {
    // May 1 2026 = Friday; May 5 = Tuesday
    it("Tuesday in May 2026 (May 5) adds 0h — optional month", () => {
      expect(hoursAddedOn("2026-05-05T12:00:00Z")).toBe(0);
    });

    it("Thursday in May 2026 (May 7) adds 0h — optional month", () => {
      expect(hoursAddedOn("2026-05-07T12:00:00Z")).toBe(0);
    });

    // Jun 1 2026 = Monday; Jun 4 = Thursday
    it("Thursday in June 2026 (Jun 4) adds 0h — optional month", () => {
      expect(hoursAddedOn("2026-06-04T12:00:00Z")).toBe(0);
    });

    // Jul 1 2026 = Wednesday; Jul 7 = Tuesday
    it("Tuesday in July 2026 (Jul 7) adds 0h — optional month", () => {
      expect(hoursAddedOn("2026-07-07T12:00:00Z")).toBe(0);
    });

    it("total at end of July equals total at end of April (optional months add nothing)", () => {
      const endApr = getTotalPossibleHoursToDate(new Date("2026-04-30T12:00:00Z"));
      const endJul = getTotalPossibleHoursToDate(new Date("2026-07-31T12:00:00Z"));
      expect(endJul).toBe(endApr);
    });
  });

  // -------------------------------------------------------------------------
  // Other no-meeting holidays
  // -------------------------------------------------------------------------
  describe("other no-meeting holidays", () => {
    it("Jul 1, 2025 (Tuesday, in no-meeting list AND optional) adds 0h", () => {
      expect(hoursAddedOn("2025-07-01T12:00:00Z")).toBe(0);
    });

    it("Nov 27, 2025 (Thursday = Thanksgiving) adds 3h — NOT in no-meeting list", () => {
      // Only Black Friday (Nov 28) is listed; Thanksgiving itself is a normal meeting
      expect(hoursAddedOn("2025-11-27T12:00:00Z")).toBe(3);
    });

    it("Nov 28, 2025 (Friday = Black Friday) adds 0h — off-season: no Friday meetings", () => {
      expect(hoursAddedOn("2025-11-28T12:00:00Z")).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // getTotalSeasonHours
  // -------------------------------------------------------------------------
  describe("getTotalSeasonHours", () => {
    it("returns a positive number", () => {
      expect(getTotalSeasonHours()).toBeGreaterThan(0);
    });

    it("does not throw", () => {
      expect(() => getTotalSeasonHours()).not.toThrow();
    });

    it("returns the same total for two reference dates within the same season", () => {
      const oct = getTotalSeasonHours(new Date("2025-10-01T12:00:00Z"));
      const nov = getTotalSeasonHours(new Date("2025-11-01T12:00:00Z"));
      expect(oct).toBe(nov);
    });

    it("equals getTotalPossibleHoursToDate at the season end (Jul 31, 2026)", () => {
      const seasonTotal = getTotalSeasonHours(new Date("2025-09-01T12:00:00Z"));
      const possibleAtEnd = getTotalPossibleHoursToDate(new Date("2026-07-31T12:00:00Z"));
      expect(seasonTotal).toBe(possibleAtEnd);
    });

    it("is greater than the partial total mid-season", () => {
      const mid = getTotalPossibleHoursToDate(new Date("2026-01-15T12:00:00Z"));
      const total = getTotalSeasonHours(new Date("2025-09-01T12:00:00Z"));
      expect(total).toBeGreaterThan(mid);
    });
  });

  // -------------------------------------------------------------------------
  // Cache behavior
  // -------------------------------------------------------------------------
  describe("clearScheduleCache", () => {
    it("produces the same results after clearing and regenerating", () => {
      const date = new Date("2025-10-01T12:00:00Z");
      const first = getTotalPossibleHoursToDate(date);
      clearScheduleCache();
      const second = getTotalPossibleHoursToDate(date);
      expect(first).toBe(second);
    });

    it("caches results — successive calls return identical values", () => {
      const date = new Date("2025-10-01T12:00:00Z");
      const first = getTotalPossibleHoursToDate(date);
      const second = getTotalPossibleHoursToDate(date);
      expect(first).toBe(second);
    });

    it("can cache multiple seasons independently", () => {
      // Use fake timers to simulate being in season 2023, then season 2025
      vi.useFakeTimers();

      vi.setSystemTime(new Date("2023-09-01T12:00:00Z"));
      clearScheduleCache();
      const total2023 = getTotalSeasonHours(new Date("2023-09-01T12:00:00Z"));

      vi.setSystemTime(new Date("2025-09-01T12:00:00Z"));
      clearScheduleCache();
      const total2025 = getTotalSeasonHours(new Date("2025-09-01T12:00:00Z"));

      // Both should be positive; they may differ only due to partial-meeting overrides
      expect(total2023).toBeGreaterThan(0);
      expect(total2025).toBeGreaterThan(0);

      vi.useRealTimers();
    });
  });

  // -------------------------------------------------------------------------
  // Leap-year handling: Feb 29, 2024 (season 2023)
  // -------------------------------------------------------------------------
  describe("leap year handling", () => {
    it("generates Feb 29, 2024 as a Thursday competition-season meeting (3h)", () => {
      // Use fake timers so generateMeetingDates() uses season 2023 (includes Feb 2024)
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2023-09-01T12:00:00Z"));
      clearScheduleCache();

      // Feb 28, 2024 = Wednesday (no meeting); Feb 29, 2024 = Thursday (comp season, 3h)
      expect(hoursAddedOn("2024-02-29T12:00:00Z")).toBe(3);

      vi.useRealTimers();
      clearScheduleCache();
    });
  });

  // -------------------------------------------------------------------------
  // Month-boundary / year-boundary handling (via nextEasternDay)
  // -------------------------------------------------------------------------
  describe("month and year boundaries", () => {
    it("Feb 28, 2026 (Saturday) adds 12h — last day of non-leap February", () => {
      // Jan 1 2026 = Thu; offset 58 days to Feb 28 → Saturday
      expect(hoursAddedOn("2026-02-28T12:00:00Z")).toBe(12);
    });

    it("Mar 1, 2026 (Sunday) adds 0h — correctly rolls over from Feb 28", () => {
      expect(hoursAddedOn("2026-03-01T12:00:00Z")).toBe(0);
    });

    it("Dec 31, 2025 → Jan 1, 2026 year rollover is handled correctly", () => {
      // Dec 31 = Wednesday (no meeting in off-season); Jan 1 = no-meeting (winter break)
      expect(hoursAddedOn("2025-12-31T12:00:00Z")).toBe(0);
      expect(hoursAddedOn("2026-01-01T12:00:00Z")).toBe(0);
    });

    it("Aug 31, 2025 → Sep 1, 2025 month rollover is handled correctly", () => {
      // Aug 31 = Sunday (no meeting); Sep 1 = Monday (no meeting)
      // Aug 1 = Fri, so Aug 31 = Fri + 30 days = (5+30)%7 = 35%7 = 0 = Sunday
      expect(hoursAddedOn("2025-08-31T12:00:00Z")).toBe(0);
      expect(hoursAddedOn("2025-09-01T12:00:00Z")).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Season year boundary (month >= 5 starts new season)
  // -------------------------------------------------------------------------
  describe("season year determination", () => {
    it("May date belongs to the current year's season", () => {
      // May 2025 → season 2025
      const may = getTotalSeasonHours(new Date("2025-05-01T12:00:00Z"));
      const oct = getTotalSeasonHours(new Date("2025-10-01T12:00:00Z"));
      expect(may).toBe(oct);
    });

    it("April date belongs to the previous year's season", () => {
      // April 2026 → season 2025 (May 2025 – Jul 2026)
      const apr = getTotalSeasonHours(new Date("2026-04-01T12:00:00Z"));
      const sep = getTotalSeasonHours(new Date("2025-09-01T12:00:00Z"));
      expect(apr).toBe(sep);
    });
  });
});
