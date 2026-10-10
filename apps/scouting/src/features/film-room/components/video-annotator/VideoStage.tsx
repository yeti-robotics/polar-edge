"use client";

import { cn } from "@repo/ui/lib/utils";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";

interface VideoStageProps {
  playerHostRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Edit mode: the canvas takes the pointer so the footage is live to draw on. */
  drawable: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
}

/** The footage and the annotation layer sitting exactly on top of it. */
export function VideoStage({
  playerHostRef,
  canvasRef,
  drawable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: VideoStageProps) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0">
        <div ref={playerHostRef} className="size-full" />
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className={cn(
          "absolute top-0 left-0 z-[6] h-full w-full touch-none",
          drawable ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
        )}
      />
    </>
  );
}
