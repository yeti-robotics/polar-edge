
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";

type ClimbRow = {
  id: string;
  standFormId: string;
  climbLevel: number;
  climbSuccess: boolean;
  climbDuration: string;
  climbPhase: "auto" | "teleop";
  createdAt: Date;
};

type MetricsTableProps = {
  climbs: ClimbRow[];
};

export default function MetricsTable({ climbs }: MetricsTableProps) {
  return (
    <Table>
      <TableCaption>Climb attempts for the selected teams.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Phase</TableHead>
          <TableHead>Level</TableHead>
          <TableHead>Success</TableHead>
          <TableHead>Duration (s)</TableHead>
          <TableHead>Recorded At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {climbs.map((climb) => (
          <TableRow key={climb.id}>
            <TableCell>{climb.climbPhase}</TableCell>
            <TableCell>{climb.climbLevel}</TableCell>
            <TableCell>{climb.climbSuccess ? "Yes" : "No"}</TableCell>
            <TableCell>{climb.climbDuration}</TableCell>
            <TableCell>
              {climb.createdAt instanceof Date
                ? climb.createdAt.toLocaleString()
                : String(climb.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}