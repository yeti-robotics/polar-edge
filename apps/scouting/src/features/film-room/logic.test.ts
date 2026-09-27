import { describe, expect, it } from "vitest";
import {
  applyQueuedOps,
  distanceToAnnotation,
  filterMatchOptions,
  firstYouTubeVideo,
  formatVideoTime,
  isAnnotationVisible,
  type MarkOp,
  parseYouTubeId,
  tbaQualMatchKey,
} from "./logic";
import type { Annotation } from "./types";

describe("parseYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=30", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=12", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["  dQw4w9WgXcQ  ", "dQw4w9WgXcQ"],
  ])("reads %s", (input, id) => {
    expect(parseYouTubeId(input)).toBe(id);
  });

  it.each(["Qual 42", "https://vimeo.com/123", ""])("rejects %s", (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });
});

describe("TBA helpers", () => {
  it("builds qual match keys", () => {
    expect(tbaQualMatchKey("2026ncwak", 42)).toBe("2026ncwak_qm42");
  });

  it("takes the first YouTube video and ignores TBA-hosted ones", () => {
    expect(
      firstYouTubeVideo([
        { type: "tba", key: "abc" },
        { type: "youtube", key: "dQw4w9WgXcQ?t=5" },
      ])
    ).toBe("dQw4w9WgXcQ");
    expect(firstYouTubeVideo([{ type: "tba", key: "abc" }])).toBeNull();
    expect(firstYouTubeVideo(undefined)).toBeNull();
  });
});

describe("filterMatchOptions", () => {
  const options = [4, 12, 42, 120].map((n) => ({ matchNumber: n, label: `Qual ${n}` }));

  it("shows everything for empty text", () => {
    expect(filterMatchOptions(options, " ")).toHaveLength(4);
  });

  it.each(["42", "q42", "qm42", "Qual 42"])("finds Qual 42 from %s", (text) => {
    expect(filterMatchOptions(options, text).map((o) => o.matchNumber)).toEqual([42]);
  });

  it("prefix-matches match numbers", () => {
    expect(filterMatchOptions(options, "12").map((o) => o.matchNumber)).toEqual([12, 120]);
  });
});

describe("distanceToAnnotation", () => {
  it("measures lines and arrows along the drawn segment, not just endpoints", () => {
    const arrow = {
      type: "arrow" as const,
      points: [
        { x: 0.1, y: 0.5 },
        { x: 0.9, y: 0.5 },
      ],
    };
    expect(distanceToAnnotation(arrow, { x: 0.5, y: 0.52 })).toBeCloseTo(0.02);
  });

  it("counts the inside of boxes and circles as a hit", () => {
    const corners = [
      { x: 0.2, y: 0.2 },
      { x: 0.6, y: 0.6 },
    ];
    expect(distanceToAnnotation({ type: "rect", points: corners }, { x: 0.4, y: 0.4 })).toBe(0);
    expect(distanceToAnnotation({ type: "ellipse", points: corners }, { x: 0.4, y: 0.4 })).toBe(0);
    expect(
      distanceToAnnotation({ type: "ellipse", points: corners }, { x: 0.9, y: 0.4 })
    ).toBeGreaterThan(0.1);
  });

  it("follows every segment of a pen stroke", () => {
    const pen = {
      type: "pen" as const,
      points: [
        { x: 0, y: 0 },
        { x: 0.5, y: 0 },
        { x: 0.5, y: 0.5 },
      ],
    };
    expect(distanceToAnnotation(pen, { x: 0.51, y: 0.25 })).toBeCloseTo(0.01);
  });

  it("is infinitely far from an empty mark", () => {
    expect(distanceToAnnotation({ type: "pen", points: [] }, { x: 0, y: 0 })).toBe(
      Number.POSITIVE_INFINITY
    );
  });
});

describe("timing", () => {
  it("shows a mark from its in-point up to (not including) its out-point", () => {
    const mark = { timestamp: 10, durationSeconds: 6 };
    expect(isAnnotationVisible(mark, 9.9)).toBe(false);
    expect(isAnnotationVisible(mark, 10)).toBe(true);
    expect(isAnnotationVisible(mark, 15.9)).toBe(true);
    expect(isAnnotationVisible(mark, 16)).toBe(false);
  });

  it("formats m:ss", () => {
    expect(formatVideoTime(0)).toBe("0:00");
    expect(formatVideoTime(75.9)).toBe("1:15");
  });
});

describe("applyQueuedOps", () => {
  const mark = (id: string, note: string): Annotation => ({
    id,
    timestamp: 1,
    durationSeconds: 6,
    type: "pen",
    points: [{ x: 0, y: 0 }],
    note,
  });

  it("lays unsynced edits, creates and deletes over the server rows", () => {
    const queue = new Map<string, MarkOp>([
      ["a", { kind: "save", annotation: mark("a", "edited") }],
      ["b", { kind: "delete", id: "b" }],
      ["c", { kind: "save", annotation: mark("c", "new") }],
    ]);
    const result = applyQueuedOps([mark("a", "old"), mark("b", "gone"), mark("d", "kept")], queue);
    expect(result.map((a) => [a.id, a.note])).toEqual([
      ["a", "edited"],
      ["d", "kept"],
      ["c", "new"],
    ]);
  });
});
