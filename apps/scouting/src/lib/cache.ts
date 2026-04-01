export const cacheTags = {
  leaderboardStand: (organizationId: string) => `leaderboard-stand-${organizationId}`,
  leaderboardPit: (organizationId: string) => `leaderboard-pit-${organizationId}`,
  leaderboardAuto: (organizationId: string) => `leaderboard-auto-${organizationId}`,
  teamsList: "teams-list",
  analysisStandFormCount: "analysis-stand-form-count",
  analysisPitFormCount: "analysis-pit-form-count",
  teamMetrics: (eventId: string) => `team-metrics-${eventId}`,
  activeEvent: (organizationId: string) => `active-event-${organizationId}`,
  eventTeams: (eventId: string) => `event-teams-${eventId}`,
  matchScores: (eventId: string) => `match-scores-${eventId}`,
  teamCommentSummary: (teamNumber: number, eventId: string) =>
    `team-comment-summary-${teamNumber}-${eventId}`,
  driveRanking: (organizationId: string, eventId?: string | null) =>
    eventId
      ? `drive-ranking-${organizationId}-${eventId}`
      : `drive-ranking-${organizationId}`,
};
