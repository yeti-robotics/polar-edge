"use client";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import {
  ChevronLeftIcon,
  PanelRightIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
} from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { VideoPlayer } from "../../hooks/use-video-player";
import { formatVideoTime } from "../../logic";
import { HOLD_MS } from "./constants";

const DOUBLE_TAP_MS = 300;
const SKIP_SECONDS = 10;
/** How long the chrome stays up after the last touch. */
const CHROME_IDLE_MS = 3000;

interface PlaybackControlsProps {
  player: VideoPlayer;
  title: string;
  /** Shifts the title clear of the offline pill. */
  offline: boolean;
  onBack?: () => void;
  onToggleNotes: () => void;
  gesturesEnabled: boolean;
  popoverOpen: boolean;
  onDismissPopover: () => void;
  /** Opens a mark's popover if one is under the finger; true when it did. */
  onProbeMark: (point: { clientX: number; clientY: number }) => boolean;
}

/**
 * The fading title bar and transport, plus the gesture zones over the footage:
 * double-tap left/right skips 10s, press-and-hold runs 0.5x/2x until release,
 * and a tap in the middle toggles play.
 */
export function PlaybackControls({
  player,
  title,
  offline,
  onBack,
  onToggleNotes,
  gesturesEnabled,
  popoverOpen,
  onDismissPopover,
  onProbeMark,
}: PlaybackControlsProps) {
  const { playing, speed, currentTime, duration, floatTimeRef, play, pause, seekTo, setRate } =
    player;

  const [chromeAwake, setChromeAwake] = useState(true);
  const [flash, setFlash] = useState<"back" | "fwd" | null>(null);
  const lastZoneTapRef = useRef<{ side: string; at: number } | null>(null);
  const holdTimerRef = useRef<number | null>(null);
  const flashTimerRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);

  const wakeChrome = useCallback(() => {
    setChromeAwake(true);
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => setChromeAwake(false), CHROME_IDLE_MS);
  }, []);

  useEffect(() => {
    wakeChrome();
  }, [wakeChrome]);

  useEffect(
    () => () => {
      for (const timer of [holdTimerRef, flashTimerRef, idleTimerRef]) {
        if (timer.current !== null) window.clearTimeout(timer.current);
      }
    },
    []
  );

  const flashSkip = useCallback((side: "back" | "fwd") => {
    setFlash(side);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setFlash(null), 550);
  }, []);

  const handleZoneDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    wakeChrome();
    if (popoverOpen) {
      onDismissPopover();
      return;
    }

    const side = event.currentTarget.dataset.side === "fwd" ? "fwd" : "back";
    const now = Date.now();
    const prev = lastZoneTapRef.current;
    lastZoneTapRef.current = { side, at: now };

    // Double-tap the same side skips
    if (prev && prev.side === side && now - prev.at < DOUBLE_TAP_MS) {
      if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
      lastZoneTapRef.current = null;
      seekTo(floatTimeRef.current + (side === "fwd" ? SKIP_SECONDS : -SKIP_SECONDS));
      flashSkip(side);
      return;
    }

    if (onProbeMark(event)) return;

    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    // Hold: 2x forward, 0.5x back, released on pointerup
    holdTimerRef.current = window.setTimeout(() => {
      setRate(side === "fwd" ? 2 : 0.5);
      play();
    }, HOLD_MS);
  };

  const handleZoneUp = () => {
    if (holdTimerRef.current !== null) window.clearTimeout(holdTimerRef.current);
    if (speed !== 1) setRate(1);
  };

  const handleCenterTap = (event: ReactPointerEvent<HTMLButtonElement>) => {
    wakeChrome();
    if (popoverOpen) {
      onDismissPopover();
      return;
    }
    // Marks in the middle strip are tappable too
    if (onProbeMark(event)) return;
    if (playing) pause();
    else play();
  };

  return (
    <>
      {gesturesEnabled && (
        <>
          <div
            data-side="back"
            onPointerDown={handleZoneDown}
            onPointerUp={handleZoneUp}
            onPointerLeave={handleZoneUp}
            className="absolute inset-y-0 left-0 z-[5] w-[42%] touch-none"
          />
          <div
            data-side="fwd"
            onPointerDown={handleZoneDown}
            onPointerUp={handleZoneUp}
            onPointerLeave={handleZoneUp}
            className="absolute inset-y-0 right-0 z-[5] w-[42%] touch-none"
          />
          <button
            type="button"
            aria-label={playing ? "Pause" : "Play"}
            onPointerDown={handleCenterTap}
            className="absolute inset-y-0 right-[42%] left-[42%] z-[5]"
          />
        </>
      )}

      {/* Skip / speed feedback */}
      {flash === "back" && (
        <div className="pointer-events-none absolute top-1/2 left-[16%] z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/55 px-5 py-3.5 text-base font-medium">
          <RotateCcwIcon className="size-5" />
          {SKIP_SECONDS}s
        </div>
      )}
      {flash === "fwd" && (
        <div className="pointer-events-none absolute top-1/2 right-[16%] z-10 flex translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/55 px-5 py-3.5 text-base font-medium">
          {SKIP_SECONDS}s
          <RotateCwIcon className="size-5" />
        </div>
      )}
      {speed !== 1 && (
        <div className="pointer-events-none absolute top-22 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full bg-black/65 px-4 py-2 text-[15px] font-semibold">
          {speed}×
        </div>
      )}

      {/* Title bar: fades out after CHROME_IDLE_MS, wakes on any tap */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent py-4 pr-33.5 pl-4.5 transition-opacity duration-250",
          chromeAwake ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div className={cn("flex min-w-0 items-center gap-2.5", offline && "ml-[108px]")}>
          {onBack && (
            <Button
              type="button"
              size="icon-lg"
              aria-label="Back to Film Room"
              className="size-10 shrink-0 rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={onBack}
            >
              <ChevronLeftIcon className="size-5" />
            </Button>
          )}
          <div className="truncate text-lg font-semibold">{title}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon-lg"
            aria-label="Notes"
            className="size-11 rounded-full bg-black/50 text-white hover:bg-black/70"
            onClick={onToggleNotes}
          >
            <PanelRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Transport */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1.5 bg-gradient-to-t from-black/75 to-transparent px-3.5 pb-3.5 transition-opacity duration-250",
          chromeAwake ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <button
          type="button"
          aria-label="Scrub"
          className="relative h-5 w-full"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seekTo(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/28" />
          <span
            className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-primary"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
          <span
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
        </button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="icon-lg"
            variant="ghost"
            aria-label={playing ? "Pause" : "Play"}
            className="size-11 rounded-full text-white hover:bg-white/10"
            onClick={() => (playing ? pause() : play())}
          >
            {playing ? <PauseIcon className="size-[22px]" /> : <PlayIcon className="size-[22px]" />}
          </Button>
          <span className="font-mono text-[13px] text-white/85">
            {formatVideoTime(currentTime)} / {formatVideoTime(duration)}
          </span>
        </div>
      </div>
    </>
  );
}
