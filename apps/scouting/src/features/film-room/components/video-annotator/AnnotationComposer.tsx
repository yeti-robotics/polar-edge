"use client";

import { Button } from "@repo/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { CheckIcon, ThumbsDownIcon, ThumbsUpIcon, Trash2Icon } from "lucide-react";
import {
  type AnnotationVerdict,
  colorForVerdict,
  type FilmRoomTeamOption,
  VERDICT_COLORS,
} from "../../types";

/** Clip lengths offered for a mark. The server accepts up to 60s. */
const CLIP_LENGTH_OPTIONS = [3, 6, 10, 20];

/** What the scout fills in for the mark currently in the composer. */
export interface ComposerFields {
  verdict: AnnotationVerdict | null;
  /** Team number as a string, or "none". */
  team: string;
  note: string;
  /** How long the mark stays on screen after its timestamp. */
  durationSeconds: number;
}

interface AnnotationComposerProps {
  fields: ComposerFields;
  onChange: (patch: Partial<ComposerFields>) => void;
  teams: FilmRoomTeamOption[];
  onSave: () => void;
  onDiscard: () => void;
}

/**
 * The note box that pops out after a stroke: verdict, how long the mark holds,
 * which team it is about, the note, and one large Save bar.
 */
export function AnnotationComposer({
  fields,
  onChange,
  teams,
  onSave,
  onDiscard,
}: AnnotationComposerProps) {
  const { verdict, team, note, durationSeconds } = fields;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-primary bg-card p-3">
      <div className="flex items-center gap-2">
        <span
          className="size-3.5 rounded-full"
          style={{ backgroundColor: colorForVerdict(verdict) }}
        />
        <span className="text-[13px] font-semibold" style={{ color: colorForVerdict(verdict) }}>
          {verdict ? verdict.toUpperCase() : "New mark"}
        </span>
        {/* Discard lives up here next to the colour dot */}
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Discard mark"
          className="ml-auto size-8.5"
          onClick={onDiscard}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Button
          type="button"
          variant={verdict === "good" ? "default" : "outline"}
          className="h-11 font-semibold"
          style={
            verdict === "good"
              ? { backgroundColor: VERDICT_COLORS.good, color: "#052e16" }
              : undefined
          }
          onClick={() => onChange({ verdict: "good" })}
        >
          <ThumbsUpIcon className="size-4" />
          Good
        </Button>
        <Button
          type="button"
          variant={verdict === "bad" ? "default" : "outline"}
          className="h-11 font-semibold"
          style={
            verdict === "bad"
              ? { backgroundColor: VERDICT_COLORS.bad, color: "#450a0a" }
              : undefined
          }
          onClick={() => onChange({ verdict: "bad" })}
        >
          <ThumbsDownIcon className="size-4" />
          Bad
        </Button>
      </div>

      {/* A long play needs a long mark: six seconds fades out mid-sequence. */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Length</span>
        <div className="ml-auto flex gap-1">
          {CLIP_LENGTH_OPTIONS.map((seconds) => (
            <Button
              key={seconds}
              type="button"
              size="sm"
              aria-pressed={durationSeconds === seconds}
              variant={durationSeconds === seconds ? "default" : "outline"}
              className="h-10 w-12 text-xs font-semibold"
              onClick={() => onChange({ durationSeconds: seconds })}
            >
              {seconds}s
            </Button>
          ))}
        </div>
      </div>

      <Select value={team} onValueChange={(value) => onChange({ team: value })}>
        <SelectTrigger className="h-11 w-full">
          <SelectValue placeholder="Which team?" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((t) => (
            <SelectItem key={t.teamNumber} value={String(t.teamNumber)}>
              {t.teamNumber}
            </SelectItem>
          ))}
          <SelectItem value="none">No team</SelectItem>
        </SelectContent>
      </Select>

      <Textarea
        value={note}
        onChange={(e) => onChange({ note: e.target.value })}
        placeholder="What should we do differently here?"
        className="min-h-22 resize-none text-sm"
      />

      {/* One large save target — the only thing you must hit accurately */}
      <Button type="button" className="h-13 text-base font-semibold" onClick={onSave}>
        <CheckIcon className="size-5" />
        Save mark
      </Button>
    </div>
  );
}
