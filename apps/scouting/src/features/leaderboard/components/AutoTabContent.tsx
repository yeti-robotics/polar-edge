import { getAutoPathCounts } from "../queries";
import { EmptyState } from "./EmptyState";
import { PodiumCard } from "./PodiumCard";
import { RankTable } from "./RankTable";

type Props = {
  organizationId: string;
};

export async function AutoTabContent({ organizationId }: Props) {
  const autoCounts = await getAutoPathCounts(organizationId);

  if (autoCounts.length === 0) {
    return <EmptyState label="auto paths" />;
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-sm">
        <PodiumCard scouts={autoCounts.slice(0, 3)} countLabel="paths" />
      </div>
      <RankTable scouts={autoCounts.slice(3)} startRank={4} />
    </div>
  );
}
