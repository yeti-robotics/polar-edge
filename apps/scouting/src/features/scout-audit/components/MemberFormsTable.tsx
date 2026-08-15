import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";
import { routes } from "@/lib/routes";
import type { MemberFormRow } from "../types";
import { COMMENTS_MIN_LENGTH, formatMatchLabel, OOF_BROKEN_THRESHOLD } from "../utils";

function AllianceBadge({ alliance, position }: { alliance: string; position: number }) {
  const isRed = alliance === "red";
  return (
    <span
      className={cn(
        "inline-flex items-center leading-none rounded px-1.5 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase",
        isRed
          ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25"
          : "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/25"
      )}
    >
      {isRed ? "R" : "B"}
      {position}
    </span>
  );
}

function FlagBar({ flagged }: { flagged: boolean }) {
  if (!flagged) return null;
  return <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-destructive" />;
}

export function MemberFormsTable({
  forms,
  memberId,
}: {
  forms: MemberFormRow[];
  memberId: string;
}) {
  if (forms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground">No stand forms submitted for this event.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[76px]">
              Match
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[110px]">
              Team
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[84px]">
              Cycles
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[58px]">
              Climbs
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[68px]">
              OOF (s)
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              Comments
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {forms.map((form) => {
            const totalCycles = form.autoCycles + form.teleopCycles;
            const cyclesFlagged = totalCycles === 0 && form.oofTimeSeconds === 0;
            const oofFlagged = form.oofTimeSeconds >= OOF_BROKEN_THRESHOLD;
            const commentsFlagged = form.comments.length < COMMENTS_MIN_LENGTH;
            const anyFlagged = cyclesFlagged || oofFlagged || commentsFlagged;

            return (
              <tr
                key={form.formId}
                className={cn(
                  "group relative transition-colors hover:bg-muted/30",
                  anyFlagged && "bg-destructive/5 hover:bg-destructive/10"
                )}
              >
                <td className="relative px-4 py-2.5 align-top">
                  <FlagBar flagged={anyFlagged} />
                  <Link
                    href={routes.admin.memberForm(memberId, form.formId)}
                    className="font-mono font-semibold text-sm text-foreground hover:text-primary transition-colors"
                  >
                    {formatMatchLabel(form.matchType, form.matchNumber)}
                  </Link>
                </td>
                <td className="px-4 py-2.5 align-top">
                  <div className="flex items-center gap-2">
                    <span className="font-mono tabular-nums text-sm">{form.teamNumber}</span>
                    <AllianceBadge alliance={form.alliance} position={form.position} />
                  </div>
                </td>
                <td className="px-4 py-2.5 align-top">
                  <span
                    className={cn(
                      "font-mono tabular-nums text-sm",
                      cyclesFlagged && "text-destructive font-semibold"
                    )}
                  >
                    {form.autoCycles}
                    <span className="text-muted-foreground mx-0.5">/</span>
                    {form.teleopCycles}
                  </span>
                  <span className="ml-1 text-[10px] text-muted-foreground">A/T</span>
                </td>
                <td className="px-4 py-2.5 align-top font-mono tabular-nums text-sm text-muted-foreground">
                  {form.climbCount}
                </td>
                <td className="px-4 py-2.5 align-top">
                  <span
                    className={cn(
                      "font-mono tabular-nums text-sm",
                      oofFlagged && "text-destructive font-semibold"
                    )}
                  >
                    {form.oofTimeSeconds}
                  </span>
                </td>
                <td className="px-4 py-2.5 align-top">
                  <p
                    className={cn(
                      "text-sm leading-relaxed whitespace-pre-wrap break-words",
                      commentsFlagged ? "text-destructive/80 italic" : "text-muted-foreground"
                    )}
                  >
                    {form.comments || (
                      <span className="text-muted-foreground/40 not-italic">—</span>
                    )}
                  </p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
