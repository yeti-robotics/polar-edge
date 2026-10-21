export interface Point {
  x: number;
  y: number;
}

export type AnnotationTool = "pen" | "line" | "arrow" | "rect" | "ellipse";

export type AnnotationVerdict = "good" | "bad";

export interface Annotation {
  id: string;
  timestamp: number;
  durationSeconds: number;
  type: AnnotationTool;
  /**
   * pen            -> N points along the freehand path
   * line / arrow   -> [start, end]
   * rect / ellipse -> [corner, oppositeCorner]
   */
  points: Point[];
  verdict?: AnnotationVerdict | null;
  note?: string | null;
  teamNumber?: number | null;
}

export const VERDICT_COLORS = {
  good: "#4ade80",
  bad: "#ef4444",
  none: "#facc15",
} as const;

export function colorForVerdict(verdict?: AnnotationVerdict | null): string {
  if (verdict === "good") return VERDICT_COLORS.good;
  if (verdict === "bad") return VERDICT_COLORS.bad;
  return VERDICT_COLORS.none;
}

export interface FilmRoomMatchOption {
  matchId: string;
  matchNumber: number;
  label: string;
  videoId: string | null;
  tbaYoutubeId: string | null;
}

export interface FilmRoomTeamOption {
  teamNumber: number;
  name?: string | null;
}

export interface TeamFilmNote {
  id: string;
  note: string;
  verdict: AnnotationVerdict | null;
  timestamp: number;
  videoId: string;
  videoTitle: string;
  createdAt: Date;
}

export interface TeamFilmSummary {
  good: number;
  bad: number;
  notes: TeamFilmNote[];
}
