import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { getTeamsForEvent } from "../queries";
import { QuickAddTeamButton } from "./QuickAddTeamButton";

interface TeamsAtEventListProps {
  eventId: string;
  picklistId: string;
  picklistTeams: number[];
}

export async function TeamsAtEventList({
  eventId,
  picklistId,
  picklistTeams,
}: TeamsAtEventListProps) {
  const allTeams = await getTeamsForEvent(eventId);
  const nextRank = picklistTeams.length + 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Teams at Event</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTeams.map((team) => {
              const inPicklist = picklistTeams.includes(team.teamNumber);
              return (
                <TableRow
                  data-removed={!inPicklist}
                  key={team.teamNumber}
                  className="data-[removed=true]:opacity-50 h-12"
                >
                  <TableCell className="font-mono font-bold">{team.teamNumber}</TableCell>
                  <TableCell>{team.teamName || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end">
                      {inPicklist ? (
                        <span className="text-sm text-muted-foreground">In Picklist</span>
                      ) : (
                        <QuickAddTeamButton
                          picklistId={picklistId}
                          teamNumber={team.teamNumber}
                          rank={nextRank}
                        />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
