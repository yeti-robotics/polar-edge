"use client";

import { cn } from "@repo/ui/lib/utils";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { NativeVideoProps } from "../../hooks/use-video-player";
import type { PlayableSource } from "../../types";

interface VideoStageProps {
  source: PlayableSource;
  isYouTube: boolean;
  playerHostRef: RefObject<HTMLDivElement | null>;
  videoElRef: RefObject<HTMLVideoElement | null>;
  nativeVideoProps: NativeVideoProps;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Edit mode: the canvas takes the pointer so the footage is live to draw on. */
  drawable: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
}

/** The footage and the annotation layer sitting exactly on top of it. */
export function VideoStage({
  source,
  isYouTube,
  playerHostRef,
  videoElRef,
  nativeVideoProps,
  canvasRef,
  drawable,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: VideoStageProps) {
  return (
    <>
      {isYouTube ? (
        <div className="pointer-events-none absolute inset-0">
          <div ref={playerHostRef} className="size-full" />
        </div>
      ) : (
        // No <track>: this is match footage a scout uploaded, with no captions.
        <video
          ref={videoElRef}
          src={source.value}
          playsInline
          {...nativeVideoProps}
          className="absolute inset-0 size-full object-contain"
        />
      )}

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
