export const cacheTags = {
  leaderboardStand: (organizationId: string) => `leaderboard-stand-${organizationId}`,
  leaderboardPit: (organizationId: string) => `leaderboard-pit-${organizationId}`,
  leaderboardAuto: (organizationId: string) => `leaderboard-auto-${organizationId}`,
  shiftSchedule: (organizationId: string) => `shift-schedule-${organizationId}`,
  teamsList: "teams-list",
  analysisStandFormCount: "analysis-stand-form-count",
  analysisPitFormCount: "analysis-pit-form-count",
  teamMetrics: (eventId: string) => `team-metrics-${eventId}`,
  activeEvent: (organizationId: string) => `active-event-${organizationId}`,
  eventTeams: (eventId: string) => `event-teams-${eventId}`,
  eventMatchNumbers: (eventId: string) => `event-match-numbers-${eventId}`,
  matchScores: (eventId: string) => `match-scores-${eventId}`,
  teamCommentSummary: (teamNumber: number, eventId: string) =>
    `team-comment-summary-${teamNumber}-${eventId}`,
};
