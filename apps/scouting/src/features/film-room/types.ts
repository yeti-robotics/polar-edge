/**
 * Film Room annotation types.
 *
 * Coordinates are ALWAYS normalized fractions (0..1) of the canvas bounding box,
 * never raw pixels — a stroke drawn on the iPad must land in the same spot on a
 * projector.
 *
 * A mark's colour IS its verdict (green = good, red = bad), so colour is derived
 * from `verdict` rather than stored. Thickness is a fixed client constant.
 */

export interface Point {
  /** 0..1 fraction of canvas width */
  x: number;
  /** 0..1 fraction of canvas height */
  y: number;
}

/** Tool names match the Postgres `annotation_type` enum. */
export type AnnotationTool = "pen" | "line" | "arrow" | "rect" | "ellipse";

/** Was the decision on screen efficient or not? */
export type AnnotationVerdict = "good" | "bad";

export interface Annotation {
  id: string;
  /** Video time in whole seconds when the annotation was drawn */
  timestamp: number;
  /**
   * Clip length: how long the mark stays on screen after `timestamp`.
   * timestamp + durationSeconds is the clip's out-point. Fixed by the client —
   * there is no length control in the UI.
   */
  durationSeconds: number;
  /**
   * Normalized geometry.
   * pen            -> N points along the freehand path
   * line / arrow   -> [start, end]
   * rect / ellipse -> [corner, oppositeCorner]
   */
  type: AnnotationTool;
  points: Point[];
  /** Null when the mark was saved without a judgement */
  verdict?: AnnotationVerdict | null;
  /** Strategist's written note — this is what rolls up onto the team overview */
  note?: string | null;
  /** Alliance team this note is about (nullable) */
  teamNumber?: number | null;
}

/** Green for good, red for bad, neutral amber when unjudged. */
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

export type VideoSourceKind = "youtube" | "upload";

/** What the player needs to play one video. */
export interface PlayableSource {
  kind: VideoSourceKind;
  /** YouTube id for "youtube", a playable (presigned) URL for "upload" */
  value: string;
}

/** A qual match offered in the Film Room picker's suggestion list. */
export interface FilmRoomMatchOption {
  matchId: string;
  matchNumber: number;
  label: string;
  /** A Film Room video this org already opened for the match */
  videoId: string | null;
  /** YouTube id TBA has for the match, if any */
  tbaYoutubeId: string | null;
}

/** An alliance team the composer can tag a mark with. */
export interface FilmRoomTeamOption {
  teamNumber: number;
  name?: string | null;
}

/** One note on the team analysis page, deep-linked back to the moment. */
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
