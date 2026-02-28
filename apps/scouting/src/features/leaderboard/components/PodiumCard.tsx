import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/avatar";
import { cn } from "@repo/ui/lib/utils";
import { CrownIcon } from "lucide-react";
import type { MemberCount } from "../queries";
import { getInitials } from "../utils";

type MedalRank = 1 | 2 | 3;

const stepConfig: Record<
  MedalRank,
  { height: string; bg: string; border: string; text: string; ring: string }
> = {
  1: {
    height: "h-24",
    bg: "bg-amber-400/10",
    border: "border-t border-x border-amber-400/40",
    text: "text-amber-400",
    ring: "ring-amber-400/60",
  },
  2: {
    height: "h-16",
    bg: "bg-slate-400/8",
    border: "border-t border-x border-slate-400/30",
    text: "text-slate-400",
    ring: "ring-slate-400/50",
  },
  3: {
    height: "h-10",
    bg: "bg-orange-700/10",
    border: "border-t border-x border-orange-600/30",
    text: "text-orange-500",
    ring: "ring-orange-600/50",
  },
};

// Sequence: 3rd → 2nd → 1st
// Bar animates 550ms; user content finishes at barDelay+830ms (user starts +400ms, label +30ms, fades 400ms).
// Next slot starts at barDelay+1000ms — ~170ms emphasis pause after the user is fully revealed.
const podiumDelayMs: Record<MedalRank, number> = {
  3: 150,
  2: 1150,
  1: 2150,
};

function PodiumSlot({
  scout,
  rank,
  countLabel,
}: {
  scout: MemberCount | undefined;
  rank: MedalRank;
  countLabel: string;
}) {
  const cfg = stepConfig[rank];
  const barDelay = podiumDelayMs[rank];
  const userDelay = barDelay + 400;

  if (!scout) {
    return (
      <div className="flex flex-col items-center gap-2 opacity-20">
        <div className="size-10 rounded-full border border-dashed border-muted-foreground/40" />
        <div
          style={{
            transformOrigin: "bottom",
            animation: `podium-rise 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) ${barDelay}ms both`,
          }}
          className={cn(
            "w-full rounded-t-xl border-dashed",
            cfg.height,
            "border-t border-x border-muted-foreground/20"
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2.5">
      <div
        style={{
          animation: `podium-fade-up 0.4s ease-out ${userDelay}ms both`,
        }}
        className="group relative"
      >
        <Avatar
          className={cn(
            "ring-2 ring-offset-2 ring-offset-background",
            rank === 1 ? "size-14" : "size-11",
            cfg.ring
          )}
        >
          <AvatarImage src={scout.userImage ?? undefined} alt={scout.userName} />
          <AvatarFallback className="text-xs font-bold">
            {getInitials(scout.userName)}
          </AvatarFallback>
        </Avatar>
        {rank === 1 && (
          <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-yellow-400 [@media(hover:hover)]:group-hover:animate-[crown-wiggle_0.4s_ease-out] motion-reduce:group-hover:animate-none">
            <CrownIcon className="size-3 text-yellow-900" />
          </span>
        )}
      </div>

      <div
        style={{
          animation: `podium-fade-up 0.4s ease-out ${userDelay + 30}ms both`,
        }}
        className="space-y-0.5 text-center"
      >
        <p
          className={cn(
            "truncate font-medium leading-tight",
            rank === 1 ? "max-w-24 text-sm" : "max-w-20 text-xs text-muted-foreground"
          )}
        >
          {scout.userName}
        </p>
        <p
          className={cn("font-bold tabular-nums leading-none", rank === 1 ? "text-2xl" : "text-lg")}
        >
          {scout.count}
        </p>
        <p className="text-[10px] text-muted-foreground">{countLabel}</p>
      </div>

      <div
        style={{
          transformOrigin: "bottom",
          animation: `podium-rise 0.55s cubic-bezier(0.34, 1.4, 0.64, 1) ${barDelay}ms both`,
        }}
        className={cn(
          "w-full rounded-t-xl flex items-center justify-center font-bold text-sm",
          cfg.height,
          cfg.bg,
          cfg.border,
          cfg.text
        )}
      >
        #{rank}
      </div>
    </div>
  );
}

type Props = {
  scouts: MemberCount[];
  countLabel: string;
};

export function PodiumCard({ scouts, countLabel }: Props) {
  return (
    <>
      {/* Inline keyframes ensure styles exist before elements paint — prevents fill-mode flash */}
      <style>{`
        @keyframes podium-rise {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes podium-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="grid grid-cols-3 items-end gap-1.5">
        <PodiumSlot scout={scouts[1]} rank={2} countLabel={countLabel} />
        <PodiumSlot scout={scouts[0]} rank={1} countLabel={countLabel} />
        <PodiumSlot scout={scouts[2]} rank={3} countLabel={countLabel} />
      </div>
    </>
  );
}
