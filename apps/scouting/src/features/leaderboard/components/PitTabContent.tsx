import { getPitFormCounts } from "../queries";
import { EmptyState } from "./EmptyState";
import { PodiumCard } from "./PodiumCard";
import { RankTable } from "./RankTable";

type Props = {
  organizationId: string;
};

export async function PitTabContent({ organizationId }: Props) {
  const pitCounts = await getPitFormCounts(organizationId);

  if (pitCounts.length === 0) {
    return <EmptyState label="pit forms" />;
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-sm">
        <PodiumCard scouts={pitCounts.slice(0, 3)} countLabel="forms" />
      </div>
      <RankTable scouts={pitCounts.slice(3)} startRank={4} />
    </div>
  );
}
