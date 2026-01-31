interface MeetingDate {
  date: Date;
  hours: number;
}

function getSeasonYear(date: Date): number {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= 5 ? year : year - 1;
}

function getSeasonStart(date: Date): Date {
  const seasonYear = getSeasonYear(date);
  return new Date(seasonYear, 4, 1);
}

/** Partial meetings: dates with reduced hours (e.g. weather). */
const PARTIAL_MEETINGS: Array<{ date: Date; hours: number }> = [
  { date: new Date(2026, 0, 24), hours: 4 }, // 1/24/2026 ice storm – 9am to 1pm
];

function getPartialMeetingHours(date: Date): number | null {
  const normalized = normalizeDate(date);
  const entry = PARTIAL_MEETINGS.find(
    (p) => normalizeDate(p.date).getTime() === normalized.getTime()
  );
  return entry ? entry.hours : null;
}

function getNoMeetingDates(seasonYear: number): Date[] {
  return [
    new Date(seasonYear, 6, 1),
    new Date(seasonYear, 6, 4),
    new Date(seasonYear, 10, 28),
    new Date(seasonYear + 1, 3, 2),
    new Date(seasonYear + 1, 3, 3),
    new Date(seasonYear + 1, 3, 4),
  ];
}

function normalizeDate(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function isOptionalMeetingDate(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 5 && day >= 1) return true;
  if (month === 6 || month === 7) return true;

  return false;
}

function isNoMeetingDate(date: Date): boolean {
  const normalizedDate = normalizeDate(date);
  const seasonYear = getSeasonYear(date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  if (month === 12 && day > 18 && year === seasonYear) {
    return true;
  }
  if (month === 1 && day <= 6 && year === seasonYear + 1) {
    return true;
  }

  const noMeetingDates = getNoMeetingDates(seasonYear);
  return noMeetingDates.some((noMeetingDate) => {
    const normalizedNoMeeting = normalizeDate(noMeetingDate);
    return normalizedDate.getTime() === normalizedNoMeeting.getTime();
  });
}

function getDayOfWeek(date: Date): number {
  return date.getDay();
}

function isRegularMeetingDay(date: Date): boolean {
  if (isNoMeetingDate(date)) {
    return false;
  }

  const month = date.getMonth() + 1;
  const dayOfWeek = getDayOfWeek(date);
  const seasonYear = getSeasonYear(date);
  const dateYear = date.getFullYear();

  if (month >= 5 && month <= 12 && dateYear === seasonYear) {
    return dayOfWeek === 2 || dayOfWeek === 4;
  }

  if (month >= 1 && month <= 4 && dateYear === seasonYear + 1) {
    return dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;
  }

  if (month >= 5 && month <= 8 && dateYear === seasonYear + 1) {
    return dayOfWeek === 2 || dayOfWeek === 4;
  }

  return false;
}

function getHoursForMeetingDay(date: Date): number {
  if (!isRegularMeetingDay(date)) {
    return 0;
  }

  const partialHours = getPartialMeetingHours(date);
  if (partialHours !== null) {
    return partialHours;
  }

  const month = date.getMonth() + 1;
  const dayOfWeek = getDayOfWeek(date);

  if (month >= 1 && month <= 4 && dayOfWeek === 6) {
    return 12;
  }

  return 3;
}

function generateMeetingDates(referenceDate: Date = new Date()): MeetingDate[] {
  const meetings: MeetingDate[] = [];
  const seasonStart = getSeasonStart(referenceDate);
  const seasonEnd = new Date(seasonStart.getFullYear() + 1, 7, 31);

  const currentDate = new Date(seasonStart);
  while (currentDate <= seasonEnd) {
    if (isRegularMeetingDay(currentDate)) {
      meetings.push({
        date: new Date(currentDate),
        hours: getHoursForMeetingDay(currentDate),
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return meetings;
}

export function getTotalPossibleHoursToDate(asOfDate: Date = new Date()): number {
  const meetings = generateMeetingDates();
  const normalizedAsOfDate = normalizeDate(asOfDate);

  return meetings
    .filter((meeting) => {
      const normalizedMeetingDate = normalizeDate(meeting.date);
      if (normalizedMeetingDate > normalizedAsOfDate) {
        return false;
      }
      if (isOptionalMeetingDate(meeting.date)) {
        return false;
      }
      return true;
    })
    .reduce((total, meeting) => total + meeting.hours, 0);
}

export function getTotalSeasonHours(referenceDate: Date = new Date()): number {
  const seasonEnd = new Date(getSeasonStart(referenceDate).getFullYear() + 1, 7, 31);
  return getTotalPossibleHoursToDate(seasonEnd);
}
