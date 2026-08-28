export function parseTbaTeamKey(teamKey: string): number {
  const teamNumber = Number.parseInt(teamKey.replace(/^frc/i, ""), 10);
  if (!Number.isFinite(teamNumber)) {
    throw new Error(`Invalid TBA team key: ${teamKey}`);
  }
  return teamNumber;
}
