import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import type { TeamStats } from "@/app/data/(subpage)/teams/[team]/actions";

interface TeamStatsCardsProps {
  stats: TeamStats | null;
}

export function TeamStatsCards({ stats }: TeamStatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Goblin</CardTitle>
            <CardDescription>Per Match</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RPMagic</CardTitle>
            <CardDescription>Per Match</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clank</CardTitle>
            <CardDescription>Per Match</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Matches</CardTitle>
            <CardDescription>Scouted</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>Goblin</CardTitle>
          <CardDescription>Per Match</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.goblinPerMatch.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>RPMagic</CardTitle>
          <CardDescription>Per Match</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rpmagicPerMatch.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Clank</CardTitle>
          <CardDescription>Per Match</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.clankPerMatch.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Matches</CardTitle>
          <CardDescription>Scouted</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.matchesCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
