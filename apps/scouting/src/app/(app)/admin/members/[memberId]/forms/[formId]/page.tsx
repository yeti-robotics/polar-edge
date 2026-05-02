import { TypographyH1, TypographyLabel, TypographyMuted } from "@repo/ui/components/typography";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClimbsSection } from "@/features/scout-audit/components/ClimbsSection";
import { CommentsSection } from "@/features/scout-audit/components/CommentsSection";
import { CyclesSection } from "@/features/scout-audit/components/CyclesSection";
import { StandFormStatsRow } from "@/features/scout-audit/components/StandFormStatsRow";
import { getStandFormForAudit } from "@/features/scout-audit/queries";
import { formatMatchLabel } from "@/features/scout-audit/utils";
import { routes } from "@/lib/routes";
import { requireAdminMember } from "@/lib/server/auth/require-member";

type PageProps = {
  params: Promise<{ memberId: string; formId: string }>;
};

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default async function StandFormAuditPage({ params }: PageProps) {
  const activeMember = await requireAdminMember();
  const { organizationId } = activeMember;
  const { memberId, formId } = await params;

  const form = await getStandFormForAudit(formId, organizationId);
  if (!form) notFound();

  const autoCycles = form.cycles.filter((c) => c.phase === "auto");
  const teleopCycles = form.cycles.filter((c) => c.phase === "teleop");

  const matchLabel = formatMatchLabel(form.matchType, form.matchNumber);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        href={routes.admin.member(memberId)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeftIcon className="size-4" />
        {form.scoutName ?? "Scout"}
      </Link>

      <div className="mb-8">
        <TypographyLabel>Stand Form</TypographyLabel>
        <TypographyH1>
          {matchLabel} — Team {form.teamNumber}
        </TypographyH1>
        <TypographyMuted className="mt-1">
          {form.eventName} · {form.alliance} {form.position} · submitted{" "}
          {formatDateTime(form.createdAt)}
        </TypographyMuted>
      </div>

      <div className="space-y-6">
        <StandFormStatsRow
          oofTimeSeconds={form.oofTimeSeconds}
          autoCycles={autoCycles.length}
          teleopCycles={teleopCycles.length}
          climbCount={form.climbs.length}
          commentsLength={form.comments.length}
          canShuttle={form.canShuttle}
        />

        <CyclesSection cycles={form.cycles} />
        <ClimbsSection climbs={form.climbs} />
        <CommentsSection comments={form.comments} />
      </div>
    </main>
  );
}
