const COMMENTS_MIN_LENGTH = 32;
const OOF_BROKEN_THRESHOLD = 130;

export function isFormFlagged({
  oofTimeSeconds,
  cycleCount,
  commentsLength,
}: {
  oofTimeSeconds: number;
  cycleCount: number;
  commentsLength: number;
}): boolean {
  return (
    oofTimeSeconds >= OOF_BROKEN_THRESHOLD ||
    (cycleCount === 0 && oofTimeSeconds === 0) ||
    commentsLength < COMMENTS_MIN_LENGTH
  );
}

export function formatMatchLabel(matchType: string, matchNumber: number): string {
  const prefixes: Record<string, string> = {
    qm: "Q",
    ef: "EF",
    qf: "QF",
    sf: "SF",
    f: "F",
  };
  const prefix = prefixes[matchType] ?? matchType.toUpperCase();
  return `${prefix}${matchNumber}`;
}

export { COMMENTS_MIN_LENGTH, OOF_BROKEN_THRESHOLD };
