import { StatItem } from "@/components/stat-item";
import { getUserFormCounts, getUserFormSubmissions } from "@/features/analysis/queries";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatMatchLabel(matchType: string | null, matchNumber: number | null) {
  if (!matchType || matchNumber === null) return null;
  return `${matchType.toUpperCase()} ${matchNumber}`;
}

export async function UserFormSubmissions({
  memberId,
  title,
  emptyLabel = "No submissions yet.",
}: {
  memberId: string;
  title: string;
  emptyLabel?: string;
}) {
  const [counts, submissions] = await Promise.all([
    getUserFormCounts(memberId),
    getUserFormSubmissions(memberId),
  ]);

  return (
    <section className="rounded-xl border bg-muted/20">
      <div className="px-6 py-5 border-b">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Stand + pit forms you&apos;ve submitted.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-b">
        <div className="px-6 py-5 md:border-r">
          <StatItem label="Your Stand Forms" value={counts.standCount} />
        </div>
        <div className="px-6 py-5 md:border-r">
          <StatItem label="Your Pit Forms" value={counts.pitCount} />
        </div>
        <div className="px-6 py-5">
          <StatItem label="Total Forms" value={counts.total} />
        </div>
      </div>
      <div className="px-6 py-4">
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="divide-y">
            {submissions.map((submission) => {
              const matchLabel = formatMatchLabel(submission.matchType, submission.matchNumber);
              return (
                <li key={`${submission.type}-${submission.id}`} className="py-3 flex flex-col gap-1">
                  <div className="text-sm font-medium text-foreground">
                    {submission.type === "stand" ? "Stand Form" : "Pit Form"}
                    {submission.teamNumber ? ` • Team ${submission.teamNumber}` : null}
                    {matchLabel ? ` • ${matchLabel}` : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Submitted {dateFormatter.format(submission.createdAt)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
