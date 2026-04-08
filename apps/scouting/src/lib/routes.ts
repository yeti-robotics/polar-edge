/**
 * Centralized route configuration.
 * All route paths should be defined here to prevent broken links.
 */
export const routes = {
  home: "/",
  login: "/login",

  // Admin
  admin: {
    root: "/admin",
    members: "/admin/members",
    invites: "/admin/invites",
    event: "/admin/event",
    settings: "/admin/settings",
    validation: "/admin/data-validation",
  },

  // Analysis
  analysis: {
    root: "/analysis",
    scoutCoverage: "/analysis/scout-coverage",
    teams: "/analysis/teams",
    comparison: "/analysis/comparison",
    events: "/analysis/events",
    graphs: "/analysis/graphs",
    overview: "/analysis/overview",
    team: (teamNumber: number | string) => `/analysis/teams/${teamNumber}` as const,
    event: (eventId: string) => `/analysis/events/${eventId}` as const,
  },

  // Auto Path
  autoPath: {
    root: "/auto-path",
    create: "/auto-path/create",
    detail: (id: string) => `/auto-path/${id}` as const,
  },

  // Forms
  forms: {
    pit: "/forms/pit",
    stand: "/forms/stand",
    driveRanking: "/forms/drive-ranking",
    workability: "/forms/workability",
  },

  // Picklist
  picklist: {
    root: "/picklist",
    detail: (id: string) => `/picklist/${id}` as const,
  },

  // Other
  leaderboard: "/leaderboard",
  profile: "/profile",
  organization: {
    create: "/organization/create",
  },
  acceptInvitation: (id: string) => `/accept-invitation/${id}` as const,
  join: (token: string) => `/join/${token}` as const,
} as const;
