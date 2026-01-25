import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import type {
  ClimbSummary,
  CycleSummary,
  MatchDetails,
} from "@/app/data/(subpage)/teams/[team]/actions";

interface MatchDetailsExpansionProps {
  details: MatchDetails | null;
  cycleSummary: CycleSummary;
  climbSummary: ClimbSummary;
}

export function MatchDetailsExpansion({
  details,
  cycleSummary,
  climbSummary,
}: MatchDetailsExpansionProps) {
  if (!details) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cycles</CardTitle>
            <CardDescription>
              {cycleSummary.totalCycles} total ({cycleSummary.autoCycles} auto,{" "}
              {cycleSummary.teleopCycles} teleop)
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Climbs</CardTitle>
            <CardDescription>
              {climbSummary.totalAttempts} attempts, {(climbSummary.successRate * 100).toFixed(0)}%
              success rate
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cycles</CardTitle>
            <CardDescription>
              {cycleSummary.totalCycles} total ({cycleSummary.autoCycles} auto,{" "}
              {cycleSummary.teleopCycles} teleop)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {details.cycles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phase</TableHead>
                      <TableHead>Cycle #</TableHead>
                      <TableHead>Bucket</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.cycles.map((cycle) => (
                      <TableRow key={cycle.id}>
                        <TableCell className="capitalize">{cycle.phase}</TableCell>
                        <TableCell>{cycle.cycleNumber}</TableCell>
                        <TableCell>{cycle.bucket}</TableCell>
                        <TableCell className="text-right">
                          {cycle.dumpDuration.toFixed(2)}s
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No cycles recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Climbs</CardTitle>
            <CardDescription>
              {climbSummary.totalAttempts} attempts, {(climbSummary.successRate * 100).toFixed(0)}%
              success rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {details.climbs.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phase</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Success</TableHead>
                      <TableHead className="text-right">Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.climbs.map((climb) => (
                      <TableRow key={climb.id}>
                        <TableCell className="capitalize">{climb.climbPhase}</TableCell>
                        <TableCell>L{climb.climbLevel}</TableCell>
                        <TableCell>
                          {climb.climbSuccess ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-red-600">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {climb.climbDuration.toFixed(2)}s
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No climbs recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {details.comments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {details.comments.map((comment, index) => (
                <p key={index} className="text-sm">
                  {comment}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
