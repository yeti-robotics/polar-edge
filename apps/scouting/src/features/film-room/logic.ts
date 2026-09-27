import type { Annotation, Point } from "./types";

/** Accepts youtu.be, /watch?v=, /embed/, /live/ and /shorts/ URLs, or a bare 11-char id. */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  const match = raw.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

/** "Qual 42" — what the picker and the title bar show. */
export function qualMatchLabel(matchNumber: number): string {
  return `Qual ${matchNumber}`;
}

/** TBA match key for a qualification match, e.g. `2026ncwak_qm42`. */
export function tbaQualMatchKey(eventCode: string, matchNumber: number): string {
  return `${eventCode}_qm${matchNumber}`;
}

/**
 * First YouTube video TBA lists for a match. TBA also lists its own "tba"
 * videos, which aren't embeddable, so only type "youtube" counts.
 */
export function firstYouTubeVideo(videos: { type: string; key: string }[] | undefined) {
  const video = videos?.find((v) => v.type === "youtube" && v.key);
  if (!video) return null;
  // Keys sometimes carry a start offset, e.g. "abc123DEF45?t=12".
  return parseYouTubeId(video.key.split(/[?&#]/)[0] ?? "");
}

/**
 * Matches the address-bar text against the qual list: "42", "q42" and
 * "Qual 42" all find Qual 42. Empty text shows everything.
 */
export function filterMatchOptions<T extends { matchNumber: number; label: string }>(
  options: T[],
  text: string
): T[] {
  const query = text.trim().toLowerCase();
  if (!query) return options;
  const digits = query.replace(/^(qual|qm|q)\s*/, "");
  if (/^\d+$/.test(digits)) {
    return options.filter((o) => String(o.matchNumber).startsWith(digits));
  }
  return options.filter((o) => o.label.toLowerCase().includes(query));
}

/**
 * Distance from `point` to the shape a strategist actually SEES.
 *
 * Shapes store only their two defining points, so measuring to stored points
 * alone makes a circle tappable only at two invisible corners. Each type is
 * measured against its drawn footprint instead, and closed shapes count their
 * whole interior, so tapping the circled robot works.
 */
export function distanceToAnnotation(
  annotation: Pick<Annotation, "type" | "points">,
  point: Point
): number {
  const pts = annotation.points;
  const start = pts[0];
  const end = pts[pts.length - 1];
  if (!start || !end) return Number.POSITIVE_INFINITY;
  if (pts.length === 1) return Math.hypot(start.x - point.x, start.y - point.y);

  const toSegment = (q: Point, r: Point): number => {
    const dx = r.x - q.x;
    const dy = r.y - q.y;
    const len = dx * dx + dy * dy;
    if (len === 0) return Math.hypot(point.x - q.x, point.y - q.y);
    const t = Math.max(0, Math.min(1, ((point.x - q.x) * dx + (point.y - q.y) * dy) / len));
    return Math.hypot(point.x - (q.x + t * dx), point.y - (q.y + t * dy));
  };

  if (annotation.type === "pen") {
    let best = Number.POSITIVE_INFINITY;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if (a && b) best = Math.min(best, toSegment(a, b));
    }
    return best;
  }

  if (annotation.type === "line" || annotation.type === "arrow") return toSegment(start, end);

  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  if (annotation.type === "rect") {
    // 0 anywhere inside the box.
    return Math.hypot(
      Math.max(minX - point.x, 0, point.x - maxX),
      Math.max(minY - point.y, 0, point.y - maxY)
    );
  }

  // ellipse: 0 inside, else scaled radial overshoot
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = Math.max((maxX - minX) / 2, 1e-6);
  const ry = Math.max((maxY - minY) / 2, 1e-6);
  const norm = Math.hypot((point.x - cx) / rx, (point.y - cy) / ry);
  return norm <= 1 ? 0 : (norm - 1) * Math.min(rx, ry);
}

/** Is the mark on screen at `time` (seconds)? In-point inclusive, out-point exclusive. */
export function isAnnotationVisible(
  annotation: Pick<Annotation, "timestamp" | "durationSeconds">,
  time: number
): boolean {
  return time >= annotation.timestamp && time < annotation.timestamp + annotation.durationSeconds;
}

export function formatVideoTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** A save or delete waiting to reach the server. */
export type MarkOp = { kind: "save"; annotation: Annotation } | { kind: "delete"; id: string };

/** Server rows with any not-yet-synced local edits laid over them. */
export function applyQueuedOps(rows: Annotation[], queue: Map<string, MarkOp>): Annotation[] {
  const byId = new Map(rows.map((a) => [a.id, a]));
  for (const [id, op] of queue) {
    if (op.kind === "delete") byId.delete(id);
    else byId.set(id, op.annotation);
  }
  return [...byId.values()];
}
