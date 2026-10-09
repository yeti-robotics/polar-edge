"use client";

import { type AnnotationVerdict, colorForVerdict } from "../../types";

export interface MarkPopover {
  /** Where the mark was tapped, as fractions of the stage. */
  x: number;
  y: number;
  verdict?: AnnotationVerdict | null;
  teamNumber?: number | null;
  note?: string | null;
}

/** Read-only details for a mark tapped in View mode. */
export function AnnotationPopover({
  popover,
  onDismiss,
}: {
  popover: MarkPopover;
  onDismiss: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 z-20 cursor-default"
        onClick={onDismiss}
      />
      <div
        className="absolute z-30 flex w-65 flex-col gap-1.5 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg"
        style={{
          // Centred under the finger, clamped so it never leaves the frame.
          left: `clamp(8px, calc(${popover.x * 100}% - 130px), calc(100% - 268px))`,
          top: `clamp(8px, calc(${popover.y * 100}% + 16px), calc(100% - 140px))`,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="size-3 rounded-full"
            style={{ backgroundColor: colorForVerdict(popover.verdict) }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: colorForVerdict(popover.verdict) }}
          >
            {popover.teamNumber ? `Team ${popover.teamNumber}` : "No team"}
          </span>
          {popover.verdict && (
            <span className="ml-auto text-xs font-semibold tracking-wide text-muted-foreground">
              {popover.verdict.toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-[13px] leading-snug">{popover.note || "No note."}</p>
      </div>
    </>
  );
}
