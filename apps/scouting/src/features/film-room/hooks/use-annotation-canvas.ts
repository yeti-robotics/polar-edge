"use client";

import { type RefObject, useCallback, useEffect, useRef } from "react";
import { alphaForAnnotation } from "../logic";
import { type Annotation, type AnnotationTool, colorForVerdict, type Point } from "../types";

/**
 * The annotation layer over the footage: sizing, painting and the frame loop.
 *
 * Geometry arrives as normalized 0..1 fractions, never pixels, so a mark drawn
 * on the iPad lines up on a laptop or a projector.
 */

/** One fixed stroke weight — the thickness control was removed by design. */
const LINE_WIDTH = 4;

type Shape = { type: AnnotationTool; points: Point[]; color: string };

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  width: number,
  height: number,
  alpha = 1
) {
  const { type, points, color } = shape;
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || alpha <= 0) return;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Keep strokes legible over bright field lighting.
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 3;

  const x0 = first.x * width;
  const y0 = first.y * height;
  const x1 = last.x * width;
  const y1 = last.y * height;

  if (type === "pen") {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    // Quadratic midpoint smoothing keeps freehand strokes from looking jagged.
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const n = points[i + 1];
      if (!p || !n) continue;
      const cx = p.x * width;
      const cy = p.y * height;
      const nx = n.x * width;
      const ny = n.y * height;
      ctx.quadraticCurveTo(cx, cy, (cx + nx) / 2, (cy + ny) / 2);
    }
    ctx.lineTo(x1, y1);
    ctx.stroke();
  } else if (type === "line" || type === "arrow") {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    if (type === "arrow") {
      const angle = Math.atan2(y1 - y0, x1 - x0);
      const head = 14;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(
        x1 - head * Math.cos(angle - Math.PI / 7),
        y1 - head * Math.sin(angle - Math.PI / 7)
      );
      ctx.lineTo(
        x1 - head * Math.cos(angle + Math.PI / 7),
        y1 - head * Math.sin(angle + Math.PI / 7)
      );
      ctx.closePath();
      ctx.fill();
    }
  } else if (type === "rect") {
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  } else if (type === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(
      (x0 + x1) / 2,
      (y0 + y1) / 2,
      Math.abs(x1 - x0) / 2,
      Math.abs(y1 - y0) / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }

  ctx.restore();
}

export interface AnnotationCanvasInput {
  /** Saved marks, each faded by how much of its clip is left. */
  annotations: Annotation[];
  /** The mark in the composer. Drawn at full alpha, in place of its saved row. */
  pending: { editingId: string | null; type: AnnotationTool; points: Point[] } | null;
  pendingColor: string;
  /** In-progress stroke, a ref so pointermove doesn't re-render. */
  draftRef: RefObject<Point[] | null>;
  draftType: AnnotationTool;
  draftColor: string;
  /** Float playback clock, for sub-second fades. */
  timeRef: RefObject<number>;
  /** Runs once per frame before painting — this is where the clock is read. */
  onFrame?: () => void;
}

export function useAnnotationCanvas(input: AnnotationCanvasInput): {
  canvasRef: RefObject<HTMLCanvasElement | null>;
} {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The loop runs off the latest props without restarting on every state change.
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    if (!width) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const { annotations, pending, pendingColor, draftRef, draftType, draftColor, timeRef } =
      inputRef.current;
    const t = timeRef.current;

    for (const annotation of annotations) {
      // The row being edited is drawn from the composer instead, at full alpha.
      if (pending?.editingId === annotation.id) continue;
      drawAnnotation(
        ctx,
        {
          type: annotation.type,
          points: annotation.points,
          color: colorForVerdict(annotation.verdict),
        },
        width,
        height,
        alphaForAnnotation(annotation, t)
      );
    }
    if (pending) {
      drawAnnotation(
        ctx,
        { type: pending.type, points: pending.points, color: pendingColor },
        width,
        height
      );
    }
    if (draftRef.current?.length) {
      drawAnnotation(
        ctx,
        { type: draftType, points: draftRef.current, color: draftColor },
        width,
        height
      );
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      inputRef.current.onFrame?.();
      redraw();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => redraw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [redraw]);

  return { canvasRef };
}
