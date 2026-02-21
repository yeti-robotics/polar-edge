import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import type { MemberCount } from "./queries";
import { getInitials } from "./utils";

export function RankTable({ scouts, startRank }: { scouts: MemberCount[]; startRank: number }) {
  if (scouts.length === 0) return null;

  const topCount = scouts[0]?.count ?? 1;

  return (
    <div className="space-y-1.5">
      {scouts.map((scout, i) => {
        const rank = startRank + i;
        const pct = topCount > 0 ? Math.round((scout.count / topCount) * 100) : 0;

        return (
          <div
            key={scout.memberId}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5"
          >
            <span className="w-8 shrink-0 rounded-full bg-muted px-2 py-0.5 text-center text-xs font-bold tabular-nums text-muted-foreground">
              {rank}
            </span>

            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={scout.userImage ?? undefined} alt={scout.userName} />
              <AvatarFallback className="text-xs font-semibold">
                {getInitials(scout.userName)}
              </AvatarFallback>
            </Avatar>

            <span className="min-w-0 flex-1 truncate text-sm font-medium">{scout.userName}</span>

            <span className="shrink-0 text-sm font-bold tabular-nums">{scout.count}</span>

            <div className="hidden w-24 shrink-0 sm:block">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground/30 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
