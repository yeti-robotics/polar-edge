export const cacheTags = {
  leaderboardStand: (organizationId: string) => `leaderboard-stand-${organizationId}`,
  leaderboardPit: (organizationId: string) => `leaderboard-pit-${organizationId}`,
  leaderboardAuto: (organizationId: string) => `leaderboard-auto-${organizationId}`,
  shiftSchedule: (organizationId: string) => `shift-schedule-${organizationId}`,
  teamsList: "teams-list",
  analysisStandFormCount: "analysis-stand-form-count",
  analysisPitFormCount: "analysis-pit-form-count",
  analysisWorkabilityFormCount: "analysis-workability-form-count",
  teamMetrics: (eventId: string) => `team-metrics-${eventId}`,
  workabilityEvent: (eventId: string, organizationId: string) =>
    `workability-event-${eventId}-${organizationId}`,
  memberWorkability: (eventId: string, memberId: string) =>
    `member-workability-${eventId}-${memberId}`,
  activeEvent: (organizationId: string) => `active-event-${organizationId}`,
  eventTeams: (eventId: string) => `event-teams-${eventId}`,
  eventMatchNumbers: (eventId: string) => `event-match-numbers-${eventId}`,
  matchScores: (eventId: string) => `match-scores-${eventId}`,
  teamCommentSummary: (teamNumber: number, eventId: string) =>
    `team-comment-summary-${teamNumber}-${eventId}`,
  eventCoprs: (eventId: string) => `event-coprs-${eventId}`,
  driveRanking: (organizationId: string, eventId?: string | null) =>
    eventId ? `drive-ranking-${organizationId}-${eventId}` : `drive-ranking-${organizationId}`,
};
