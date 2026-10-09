"use client";

import { Button } from "@repo/ui/components/button";
import { Trash2Icon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { formatVideoTime } from "../../logic";
import { type Annotation, colorForVerdict } from "../../types";

export const DRAWER_WIDTH = 360;

interface NotesDrawerProps {
  /** How far the drawer is pulled out, 0..DRAWER_WIDTH. */
  offset: number;
  /** False while a finger is dragging it, so it tracks the finger exactly. */
  animated: boolean;
  heading: string;
  onClose: () => void;
  annotations: Annotation[];
  onEditMark: (annotation: Annotation) => void;
  onDeleteMark: (annotation: Annotation) => void;
  /** The composer, when a mark is open in it. */
  children?: ReactNode;
}

/** The sidebar: the composer pops out here after a mark is drawn, over the list. */
export function NotesDrawer({
  offset,
  animated,
  heading,
  onClose,
  annotations,
  onEditMark,
  onDeleteMark,
  children,
}: NotesDrawerProps) {
  return (
    <aside
      className="absolute inset-y-0 right-0 z-25 box-border flex w-[360px] flex-col gap-3 overflow-y-auto border-l bg-background p-3.5 text-foreground ease-out"
      style={{
        transform: `translateX(${DRAWER_WIDTH - offset}px)`,
        transition: animated ? "transform 220ms" : "none",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{heading}</div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Close notes"
          onClick={onClose}
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      {children}

      {/* Collapsed list: colour, time, team number coloured by verdict */}
      <ul className="flex flex-col gap-1.5">
        {annotations.length === 0 && !children && (
          <li className="py-6 text-center text-sm text-muted-foreground">
            No marks yet. Switch to Edit and mark up the frame.
          </li>
        )}
        {[...annotations]
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((a) => (
            <li key={a.id} className="flex items-center gap-1 rounded-xl border bg-card">
              <button
                type="button"
                onClick={() => onEditMark(a)}
                className="flex flex-1 items-center gap-2.5 rounded-xl p-3 text-left hover:bg-accent"
              >
                <span
                  className="size-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colorForVerdict(a.verdict) }}
                />
                <span className="font-mono text-[13px] text-muted-foreground">
                  {formatVideoTime(a.timestamp)}
                </span>
                <span
                  className="ml-auto text-sm font-semibold"
                  style={{ color: a.verdict ? colorForVerdict(a.verdict) : undefined }}
                >
                  {a.teamNumber ?? "—"}
                </span>
              </button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Delete mark"
                className="mr-1.5"
                onClick={() => onDeleteMark(a)}
              >
                <Trash2Icon className="size-4" />
              </Button>
            </li>
          ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Tap a mark to edit it. In View mode, tap one on the video to read its note.
      </p>
    </aside>
  );
}
