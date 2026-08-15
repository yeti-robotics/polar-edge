export type MemberFormSummary = {
  totalForms: number;
  avgCyclesPerForm: number;
  flaggedCount: number;
};

export type MemberFormRow = {
  formId: string;
  matchType: string;
  matchNumber: number;
  teamNumber: number;
  alliance: string;
  position: number;
  autoCycles: number;
  teleopCycles: number;
  climbCount: number;
  oofTimeSeconds: number;
  comments: string;
  createdAt: Date;
};

export type AuditCycleRow = {
  cycleNumber: number;
  phase: "auto" | "teleop";
  dumpDuration: number;
};

export type AuditClimbRow = {
  index: number;
  climbPhase: "auto" | "teleop";
  climbDuration: number;
};

export type StandFormDetail = {
  formId: string;
  matchType: string;
  matchNumber: number;
  teamNumber: number;
  alliance: string;
  position: number;
  eventName: string;
  comments: string;
  canShuttle: boolean | null;
  oofTimeSeconds: number;
  scoutName: string | null;
  scoutImage: string | null;
  memberId: string;
  createdAt: Date;
  cycles: AuditCycleRow[];
  climbs: AuditClimbRow[];
};
