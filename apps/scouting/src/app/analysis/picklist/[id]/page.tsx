import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ArrowLeftIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAvailableTeamsForPicklist, getPicklistWithTeams } from "../queries";
import { DeletePicklistButton } from "./DeletePicklistButton";
import { PickedCheckbox } from "./PickedCheckbox";
import { RemoveTeamButton } from "./RemoveTeamButton";
import { ReorderButtons } from "./ReorderButtons";
import { TeamsAtEventList } from "./TeamsAtEventList";

interface PicklistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PicklistDetailPage({ params }: PicklistDetailPageProps) {
  const { id } = await params;
  const requestHeaders = await headers();
  const activeMember = await auth.api.getActiveMember({ headers: requestHeaders });

  if (!activeMember) {
    redirect("/");
  }

  const data = await getPicklistWithTeams(id, activeMember.organizationId);

  if (!data) {
    redirect("/analysis/picklist");
  }

  const { picklist, teams } = data;
  const availableTeams = await getAvailableTeamsForPicklist(picklist.eventId, id);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <Link
          href="/analysis/picklist"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="size-4 mr-2" />
          Back to Picklists
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{picklist.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {teams.length} {teams.length === 1 ? "team" : "teams"}
            </p>
          </div>
          <div className="flex gap-2">
            <DeletePicklistButton picklistId={id}>
              <Button variant="destructive">
                <Trash2Icon className="size-4 mr-2" />
                Delete Picklist
              </Button>
            </DeletePicklistButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Team Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p className="mb-4">No teams added yet. Add a team to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team, index) => (
                    <TableRow key={team.teamNumber} className={team.picked ? "opacity-50" : ""}>
                      <TableCell>
                        <PickedCheckbox
                          picklistId={id}
                          teamNumber={team.teamNumber}
                          picked={team.picked}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium">{team.rank}</TableCell>
                      <TableCell
                        className={`font-mono font-bold ${team.picked ? "line-through" : ""}`}
                      >
                        {team.teamNumber}
                      </TableCell>
                      <TableCell className={team.picked ? "line-through" : ""}>
                        {team.teamName || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <ReorderButtons
                            picklistId={id}
                            teamNumber={team.teamNumber}
                            currentRank={team.rank}
                            isFirst={index === 0}
                            isLast={index === teams.length - 1}
                          />
                          <RemoveTeamButton picklistId={id} teamNumber={team.teamNumber} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <TeamsAtEventList
            eventId={picklist.eventId}
            picklistId={id}
            picklistTeams={teams.map((t) => t.teamNumber)}
          />
        </div>
      </div>
    </main>
  );
}
