import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { TypographyMuted } from "@repo/ui/components/typography";
import { ClapperboardIcon } from "lucide-react";
import Link from "next/link";
import { routes } from "@/lib/routes";
import { formatVideoTime } from "../logic";
import { colorForVerdict, type TeamFilmSummary } from "../types";

function VerdictCount({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums tracking-tight leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

export function TeamFilmNotesCard({ summary }: { summary: TeamFilmSummary }) {
  const total = summary.good + summary.bad;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClapperboardIcon className="size-4 text-muted-foreground" />
          Film Room
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {total === 0 && summary.notes.length === 0 ? (
          <TypographyMuted>No film marks for this team yet.</TypographyMuted>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              <VerdictCount label="Good" value={summary.good} color={colorForVerdict("good")} />
              <VerdictCount label="Bad" value={summary.bad} color={colorForVerdict("bad")} />
            </div>

            {summary.notes.length > 0 && (
              <ul className="divide-y rounded-lg border">
                {summary.notes.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={routes.filmRoom.video(n.videoId, n.timestamp)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent"
                    >
                      <span
                        className="mt-1.5 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: colorForVerdict(n.verdict) }}
                      />
                      <span className="min-w-0 flex-1 text-sm">{n.note}</span>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {n.videoTitle} · {formatVideoTime(n.timestamp)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
