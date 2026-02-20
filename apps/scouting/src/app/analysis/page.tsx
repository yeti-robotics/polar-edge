import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import ExportButton from "./ExportButton";

// for now this is hardcoded and used from shacn but i can make this dunamic
export default function DataPage() {
  return (
    <main className="container mx-auto px-4 py-6 mt-4 overflow-hidden">
      <OverviewPage />
      <ExportButton />
      <TableData />
    </main>
  );
}
function OverviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-mono tracking-tight">Analysis Overview</h1>
      {/* <Skeleton /> ///  use later when data is showing */}
      <p className="text-muted-foreground ">
        <Table></Table>
      </p>
    </div>
  );
}

function TableData() {
  return (
    <Table>
      <TableCaption> YeTi </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-25"> MOCK </TableHead>
          <TableHead>MOCK </TableHead>
          <TableHead>MOCK </TableHead>
          <TableHead className="text-right">MOCK </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">MOCK </TableCell>
          <TableCell>MOCK </TableCell>
          <TableCell>MOCK </TableCell>
          <TableCell className="text-right">MOCK </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
