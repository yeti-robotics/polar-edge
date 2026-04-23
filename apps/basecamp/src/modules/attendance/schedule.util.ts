const EASTERN_TZ = "America/New_York";

const EASTERN_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: EASTERN_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const EASTERN_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: EASTERN_TZ,
  weekday: "short",
});

const WEEKDAY_TO_NUM: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

type EasternDate = { year: number; month: number; day: number };

interface MeetingDate {
  date: Date;
  hours: number;
}

/** Partial meetings: "YYYY-MM-DD" (Eastern) → hours. */
const PARTIAL_MEETINGS = new Map<string, number>([
  ["2026-01-24", 4], // 1/24/2026 ice storm – 9am to 1pm
]);

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const SEASON_END_MONTH = 7;
const SEASON_END_DAY = 31;

/** Cached meeting dates by season year (May–July). Reused across requests. */
const MEETING_DATES_BY_SEASON = new Map<number, MeetingDate[]>();

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getEasternDateParts(date: Date): EasternDate {
  const parts = EASTERN_PARTS_FORMATTER.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function toEasternDateString(parts: EasternDate): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

function getEasternDateString(date: Date): string {
  return toEasternDateString(getEasternDateParts(date));
}

function getEasternDayOfWeek(date: Date): number {
  return WEEKDAY_TO_NUM[EASTERN_WEEKDAY_FORMATTER.format(date)] ?? 0;
}

function toEasternDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function getSeasonYearFromParts(parts: EasternDate): number {
  return parts.month >= 5 ? parts.year : parts.year - 1;
}

function getSeasonYear(date: Date): number {
  return getSeasonYearFromParts(getEasternDateParts(date));
}

function getSeasonStart(date: Date): Date {
  return toEasternDate(getSeasonYear(date), 5, 1);
}

function getPartialMeetingHours(date: Date): number | null {
  const hours = PARTIAL_MEETINGS.get(getEasternDateString(date));
  return hours ?? null;
}

/** No-meeting date strings "YYYY-MM-DD" for a season (Eastern). */
function getNoMeetingDateStrings(seasonYear: number): Set<string> {
  const dates: [number, number, number][] = [
    [seasonYear, 7, 1],
    [seasonYear, 7, 4],
    [seasonYear, 11, 28],
    [seasonYear + 1, 3, 7],
    [seasonYear + 1, 3, 8],
    [seasonYear + 1, 3, 20], // Competition
    [seasonYear + 1, 3, 21], // Competition
    [seasonYear + 1, 4, 2],
    [seasonYear + 1, 4, 3],
    [seasonYear + 1, 4, 4],
    [seasonYear + 1, 4, 23],
    [seasonYear + 1, 4, 24],
    [seasonYear + 1, 4, 25],
  ];
  return new Set(dates.map(([y, mo, d]) => `${y}-${pad2(mo)}-${pad2(d)}`));
}

function isOptionalMeetingDate(date: Date): boolean {
  const { month, day } = getEasternDateParts(date);
  return (month === 5 && day >= 1) || month === 6 || month === 7;
}

function isNoMeetingDate(date: Date): boolean {
  const parts = getEasternDateParts(date);
  const seasonYear = getSeasonYearFromParts(parts);

  // December 19–January 6: No meetings
  if (parts.month === 12 && parts.day > 18 && parts.year === seasonYear) return true;
  if (parts.month === 1 && parts.day <= 6 && parts.year === seasonYear + 1) return true;

  return getNoMeetingDateStrings(seasonYear).has(toEasternDateString(parts));
}

function isRegularMeetingDay(date: Date): boolean {
  if (isNoMeetingDate(date)) return false;

  const parts = getEasternDateParts(date);
  const dayOfWeek = getEasternDayOfWeek(date);
  const seasonYear = getSeasonYearFromParts(parts);

  // May–December: Tuesday and Thursday
  if (parts.month >= 5 && parts.month <= 12 && parts.year === seasonYear) {
    return dayOfWeek === 2 || dayOfWeek === 4;
  }
  // January–April: Tuesday, Thursday, Friday, Saturday
  if (parts.month >= 1 && parts.month <= 4 && parts.year === seasonYear + 1) {
    return dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;
  }
  // May–August: Tuesday and Thursday
  if (parts.month >= 5 && parts.month <= 8 && parts.year === seasonYear + 1) {
    return dayOfWeek === 2 || dayOfWeek === 4;
  }
  return false;
}

function getHoursForMeetingDay(date: Date): number {
  if (!isRegularMeetingDay(date)) return 0;

  const partial = getPartialMeetingHours(date);
  if (partial !== null) return partial;

  const { month } = getEasternDateParts(date);
  const dayOfWeek = getEasternDayOfWeek(date);
  return month >= 1 && month <= 4 && dayOfWeek === 6 ? 12 : 3;
}

function daysInMonth(year: number, month: number): number {
  if (month !== 2) return DAYS_IN_MONTH[month - 1] ?? 31;
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return isLeap ? 29 : 28;
}

function nextEasternDay(y: number, m: number, d: number): EasternDate {
  d += 1;
  if (d > daysInMonth(y, m)) {
    d = 1;
    m += 1;
  }
  if (m > 12) {
    m = 1;
    y += 1;
  }
  return { year: y, month: m, day: d };
}

function generateMeetingDates(referenceDate: Date = new Date()): MeetingDate[] {
  const seasonYear = getSeasonYear(referenceDate);
  const cached = MEETING_DATES_BY_SEASON.get(seasonYear);
  if (cached) return cached;

  const meetings: MeetingDate[] = [];
  const start = getEasternDateParts(getSeasonStart(referenceDate));
  let cur: EasternDate = { ...start };
  const end: EasternDate = { year: start.year + 1, month: SEASON_END_MONTH, day: SEASON_END_DAY };

  while (
    cur.year < end.year ||
    (cur.year === end.year &&
      (cur.month < end.month || (cur.month === end.month && cur.day <= end.day)))
  ) {
    const date = toEasternDate(cur.year, cur.month, cur.day);
    if (isRegularMeetingDay(date)) {
      meetings.push({ date, hours: getHoursForMeetingDay(date) });
    }
    cur = nextEasternDay(cur.year, cur.month, cur.day);
  }

  MEETING_DATES_BY_SEASON.set(seasonYear, meetings);
  return meetings;
}

/** Clears the meeting-dates cache. Use in tests or when PARTIAL_MEETINGS / schedule config changes. */
export function clearScheduleCache(): void {
  MEETING_DATES_BY_SEASON.clear();
}

export function getTotalPossibleHoursToDate(asOfDate: Date = new Date()): number {
  const meetings = generateMeetingDates();
  const asOfStr = getEasternDateString(asOfDate);

  let total = 0;
  for (const meeting of meetings) {
    const meetingStr = getEasternDateString(meeting.date);
    if (meetingStr <= asOfStr && !isOptionalMeetingDate(meeting.date)) {
      total += meeting.hours;
    }
  }
  return total;
}

export function getTotalSeasonHours(referenceDate: Date = new Date()): number {
  const start = getEasternDateParts(getSeasonStart(referenceDate));
  return getTotalPossibleHoursToDate(
    toEasternDate(start.year + 1, SEASON_END_MONTH, SEASON_END_DAY)
  );
}
