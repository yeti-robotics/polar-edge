import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { TypographyMuted } from "@repo/ui/components/typography";
import type { AuditClimbRow } from "../types";

export function ClimbsSection({ climbs }: { climbs: AuditClimbRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Climbs</CardTitle>
      </CardHeader>
      <CardContent>
        {climbs.length === 0 ? (
          <TypographyMuted>No climbs recorded.</TypographyMuted>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Duration (s)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {climbs.map((c) => (
                <TableRow key={c.index}>
                  <TableCell className="tabular-nums">{c.index}</TableCell>
                  <TableCell className="capitalize">{c.climbPhase}</TableCell>
                  <TableCell className="tabular-nums">{c.climbDuration.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
